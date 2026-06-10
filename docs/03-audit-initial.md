# Audit Sécurité & Bugs — Cercle

> Relecture exhaustive du code en place (API + front Expo) avant le refactor.
> Classé par criticité, avec pour chaque point : **lieu**, **faille**, **impact**, **correction**.
> Les corrections marquées 🔧 seront intégrées dans le refactor backend (TypeORM + POO).

---

## Périmètre

- **Audité** : auth (register/login/refresh/logout), heartbeat, links, states, modèle BDD + trigger, client API front, store auth front, SecureStore.
- **Hors audit** (pas encore écrit) : modération / signalement, upload de photos, écrans inscription / journal côté front.

---

## 🔴 Bloquant — à corriger avant tout

### B1. Timing attack sur `/auth/login`

**Lieu** : `auth.service.ts > login()`
**Faille** : si l'email n'existe pas, on `throw` avant `verifyPassword`. Le hash Argon2 prend ~50–200 ms, donc une réponse en 5 ms = email inconnu, en 100 ms = email connu mais mauvais MDP.
**Impact** : énumération de comptes (un attaquant peut découvrir quels emails sont inscrits sur la plateforme).
**Correction 🔧** : toujours exécuter un `verifyPassword` contre un hash factice quand l'user n'existe pas, et garder un message d'erreur identique dans les deux cas.

```ts
// Hash Argon2 pré-calculé d'un mot de passe quelconque (constant)
const DUMMY_HASH = '$argon2id$v=19$m=65536,t=3,p=4$...';

const user = rows[0];
const hashToCheck = user?.password_hash ?? DUMMY_HASH;
const valid = await verifyPassword(hashToCheck, password);
if (!user || !valid) throw new AppError(401, 'Identifiants invalides');
```

---

### B2. Race condition sur le trigger « 3 liens max »

**Lieu** : `schema.sql > trg_links_max_three_insert`
**Faille** : le trigger fait `SELECT COUNT(*) … WHERE status='active'`. Avec deux INSERT concurrents et `READ COMMITTED`, les deux peuvent voir 2 liens actifs et passer la vérif → 4 liens actifs.
**Impact** : violation de l'invariant produit (les 3 max). Discret mais réel.
**Correction 🔧** : sérialiser via transaction + lock applicatif. Soit `SELECT … FOR UPDATE` dans une transaction au niveau du repository, soit ajouter une contrainte unique composite sur un `slot_number` (1, 2, 3) par owner pour rendre la contrainte vérifiable au niveau index.

Reco pour notre cas : transaction `SERIALIZABLE` côté `LinkRepository.create()` — simple et suffisant au volume MVP.

---

### B3. Rate limit en mémoire ne tient pas en cluster

**Lieu** : `app.ts > authLimiter`
**Faille** : `express-rate-limit` par défaut stocke les compteurs en mémoire de l'instance Node. Dès qu'on déploie sur 2+ instances (Railway, Render, K8s…), un attaquant qui tape les deux instances divise sa limite par deux.
**Impact** : brute force possible en prod multi-instance, même avec « rate limit en place ».
**Correction 🔧** : utiliser un store partagé. `rate-limit-redis` + Redis en prod. En dev, on garde le store mémoire.

---

### B4. Pas de blacklist d'access tokens après révocation

**Lieu** : `auth.service.ts > logout()`, `middlewares/auth.ts > requireAuth`
**Faille** : `logout` révoque le refresh, mais l'access token reste valide 15 min. Si l'access a été volé (par ex. XSS sur le web), l'attaquant a une fenêtre de 15 min après logout pour l'utiliser.
**Impact** : compromission temporaire après une révocation explicite.
**Correction 🔧** : table `revoked_access_jti` (jti = id unique du token) + vérification dans `requireAuth`. Alternative légère : cache Redis avec TTL = 15 min. Si on ne veut pas de Redis, on documente la fenêtre comme acceptée.

Reco : cache Redis (qu'on aura déjà pour B3).

---

## 🟠 Important — à corriger avant prod sérieuse

### I1. CORS trop permissif par défaut

**Lieu** : `app.ts`
**Faille** : `cors({ origin: process.env.CORS_ORIGIN?.split(',') ?? true })` — le `?? true` autorise *toutes* les origines si la variable n'est pas définie.
**Impact** : exposition à n'importe quel front (atténué par notre auth Bearer header, mais hygiène faible).
**Correction 🔧** : refuser de démarrer en prod sans `CORS_ORIGIN` explicite. En dev, garder un fallback liste blanche (`localhost:8081`, `localhost:19006`).

---

### I2. Pas de verrouillage de compte après tentatives échouées

**Lieu** : `auth.service.ts > login()`
**Faille** : on peut tester des MDP indéfiniment sur un compte ciblé (le rate limit IP aide, mais un attaquant distribué passe outre).
**Impact** : brute force ciblé possible.
**Correction 🔧** : compteur d'échecs par user en BDD (`failed_login_attempts`, `locked_until`). Après 5 échecs → verrou 15 min. Reset à 0 après login réussi.

---

### I3. Pas de limite de sessions concurrentes par user

**Lieu** : `auth.service.ts > issueTokens()`
**Faille** : chaque login crée une nouvelle ligne dans `auth_refresh_tokens` sans limite. Un user peut accumuler des centaines de sessions au fil du temps.
**Impact** : hygiène faible, et pas d'endpoint « me déconnecter de partout ».
**Correction 🔧** : limite à 5 sessions actives par user — au 6e login, on révoque le plus ancien. Endpoint `POST /auth/logout-all` qui révoque tout sauf la session courante.

---

### I4. Pas d'auto-cleanup des données expirées

**Lieu** : `auth_refresh_tokens`, `emotional_states`, `password_resets`
**Faille** : les lignes expirées s'accumulent indéfiniment. À terme, la table grossit, les index dégénèrent, l'audit RGPD devient lourd.
**Impact** : performance dégradée, coûts BDD, complexité de purge a posteriori.
**Correction 🔧** : EVENT MySQL planifié toutes les 24h qui purge `expires_at < NOW() - INTERVAL 7 DAY` sur les 3 tables. Alternative : cron côté Node.

---

### I5. Politique de mot de passe trop permissive

**Lieu** : `auth.routes.ts > registerSchema`
**Faille** : `z.string().min(8)` accepte `12345678`. Pas de mixed-case, pas de check contre les MDP connus.
**Impact** : comptes vulnérables au password spraying (essais des MDP les plus communs).
**Correction 🔧** : règle OWASP moderne — longueur ≥ 12 caractères, vérification contre la liste HaveIBeenPwned (API k-anonymous gratuite). On préfère **longueur > complexité** (UX moins frustrante, sécurité équivalente).

---

### I6. Logging des échecs de login absent

**Lieu** : `auth.service.ts`
**Faille** : aucune trace dans `audit_log` quand un login échoue. Impossible de détecter une attaque en cours.
**Impact** : aveugle face à des tentatives suspectes.
**Correction 🔧** : entrée `audit_log` à chaque tentative (succès et échec) avec IP, user-agent, raison.

---

### I7. `removeLink` laisse traîner les nudges actifs

**Lieu** : `links.service.ts > removeLink()`
**Faille** : on passe le lien à `status='removed'` mais les `nudges` `suggested` qui pointent dessus restent. L'UI peut afficher « relance pour Marie » alors que Marie a été retirée du cercle.
**Impact** : bug UX, suggestions incohérentes.
**Correction 🔧** : à la suppression du lien, `UPDATE nudges SET status='dismissed' WHERE link_id = ? AND status='suggested'`. À faire dans la même transaction.

---

### I8. SecureStore Android sans verrou device

**Lieu** : `lib/storage.ts`
**Faille** : `expo-secure-store` sur Android utilise le hardware keystore si le device a un PIN/biométrie. Sans verrou, fallback sur un chiffrement plus faible.
**Impact** : tokens potentiellement extractibles sur un device non verrouillé volé.
**Correction** : documenter la limite. Option : refuser le lancement si pas de verrou (UX agressive). Pour le MVP : laisser comme ça + documenter dans le README.

---

## 🟡 Mieux — bugs subtils et dette technique

### M1. Calcul d'âge sur les bords (29 février)

**Lieu** : `auth.service.ts > isAdult()`
**Faille** : `new Date(dob.getFullYear() + 18, dob.getMonth(), dob.getDate())` pour un user né le 29/02/2008 : `new Date(2026, 1, 29)` → 1er mars 2026 (29 février n'existe pas). Comportement subtilement faux.
**Impact** : décalage d'un jour sur les utilisateurs nés le 29 février.
**Correction 🔧** : remplacer par une comparaison directe :

```ts
function getAge(birthdate: string): number {
  const dob = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}
```

---

### M2. Pas d'unicité du contact dans un cercle

**Lieu** : `links.service.ts > createLink()`
**Faille** : rien n'empêche d'ajouter deux fois la même personne (même `member_user_id` ou même `contact_phone`) dans son cercle.
**Impact** : doublons dans le cercle. Pire : ça bouffe deux des trois slots.
**Correction 🔧** : vérification applicative dans le repository avant insertion. MySQL ne supporte pas les index uniques partiels (avec `WHERE status='active'`), donc on vérifie en code dans la transaction.

---

### M3. Pas de pagination sur le journal et les nudges

**Lieu** : `heartbeat.service.ts > listSuggestedNudges()` et futur listing journal
**Faille** : on renvoie tout. Au fil des mois, la liste grossit, la requête ralentit.
**Impact** : performance qui se dégrade silencieusement.
**Correction 🔧** : cursor-based pagination (`?before=<id>&limit=20`). Plus stable que `OFFSET` sur données mutables.

---

### M4. Pas de timeout sur les requêtes API côté front

**Lieu** : `app/src/lib/api.ts`
**Faille** : si le serveur est lent ou injoignable, le `fetch` peut traîner indéfiniment.
**Impact** : UX dégradée, états de chargement infinis.
**Correction** : `AbortController` avec `setTimeout(15s)`.

---

### M5. Distinction erreurs réseau / HTTP côté front

**Lieu** : `api.ts`
**Faille** : un fetch qui échoue (offline, DNS, timeout) jette une erreur générique. L'UI ne peut pas distinguer « pas de réseau » de « 500 serveur ».
**Impact** : messages d'erreur peu utiles à l'user.
**Correction** : classe `NetworkError` distincte de `ApiError`, try/catch autour du `fetch` brut.

---

### M6. QueryClient retry indiscriminé

**Lieu** : `app/_layout.tsx`
**Faille** : `retry: 1` retry sur tout, y compris 401, 403, 404 — où retry est inutile et bruyant.
**Impact** : requêtes superflues sur des erreurs métier.
**Correction** : retry conditionnel — uniquement sur erreurs réseau ou 5xx.

```ts
retry: (failureCount, error) => {
  if (error instanceof ApiError && error.status < 500) return false;
  return failureCount < 1;
}
```

---

### M7. `refreshOnce` déconnecte trop vite

**Lieu** : `api.ts > doRefresh()`
**Faille** : un échec transient de `/auth/refresh` (timeout réseau) déclenche un `clear()` complet → user déconnecté pour une coupure passagère.
**Impact** : déconnexions intempestives en réseau instable (mobile).
**Correction** : ne `clear()` que si le serveur répond explicitement 401. Si erreur réseau, on laisse le token actuel en place et on laisse l'user retenter.

---

### M8. Pas de rate limit applicatif sur les écritures sensibles

**Lieu** : `heartbeat.routes.ts > POST /journal`, `states.routes.ts > PUT /me`
**Faille** : un user peut spammer 1000 entrées de journal ou changer son état émotionnel toutes les secondes.
**Impact** : grossissement BDD, possible abus.
**Correction 🔧** : rate limit applicatif sur ces routes (ex. 30 entrées de journal / heure / user). Différent de B3 (qui protège contre les attaquants), celui-ci protège contre les utilisateurs frénétiques.

---

## 🟢 Hors périmètre / acceptés

- **API URL en clair dans `app.json`** — l'URL d'API n'est pas un secret. OK tel quel.
- **JWT secret en `dev-access-secret` par défaut** — voulu pour le dev. La doc rappelle de régénérer en prod (`openssl rand -hex 64`).
- **Pas de protection CSRF** — on utilise JWT en header `Authorization`, pas de cookies, donc CSRF non applicable. OK.
- **Pas de 2FA** — hors scope MVP. À ajouter post-launch.

---

## Priorisation pour le refactor

Le refactor backend (TypeORM + POO) va intégrer **tous les 🔧** dans la foulée. Concrètement, dans l'ordre :

1. **Couche Repository** : transactions sur `LinkRepository.create()` (B2), unicité contact (M2), cleanup des nudges au remove (I7).
2. **AuthService** : DUMMY_HASH (B1), compteur d'échecs + verrou (I2), limite de sessions (I3), logging (I6), HIBP (I5).
3. **Middleware auth** : blacklist d'access tokens via cache (B4).
4. **Config app** : CORS strict en prod (I1), rate limit Redis (B3).
5. **Helpers** : `getAge` corrigé (M1).
6. **Cron / EVENT** : cleanup expirations (I4), rate limit applicatif sur les écritures (M8).
7. **Pagination** : cursor sur listings (M3).

Le front (M4, M5, M6, M7) sera repris lors du branchement des 4 écrans.

---

**Bottom line** : aucune faille n'est exploitable trivialement en l'état (l'API n'est pas exposée), mais B1 à B4 doivent partir avant tout déploiement public. Le reste est de l'hygiène progressive.
