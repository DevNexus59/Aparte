# Audit Sécurité & Bugs — v2 (passe complémentaire)

> Cette passe complète l'audit initial (`03-audit-initial.md`) après l'ajout des modules **modération**, **photos**, **cron**, **push notifications**, et la migration en **monorepo**.
> Mêmes conventions : 🔴 bloquant, 🟠 important, 🟡 mieux. Items 🔧 = à corriger directement dans le code.

---

## 🔴 Bloquant

### B5. SSRF via la modération d'image

**Lieu** : `apps/api/src/services/PhotoService.ts > uploadProfilePhoto`
**Faille** : `moderation.screenImage({ imageUrl: url })` passe l'URL générée à un classifier qui fera `fetch(url)`. En dev, `url = http://localhost:4000/files/<uuid>.jpg`. Si demain un classifier reçoit une URL fournie par un user (pas notre cas pour l'instant, mais l'API `screenImage` accepte n'importe quelle URL), il peut être détourné en SSRF (faire fetcher des URLs internes : `http://169.254.169.254/`, `http://localhost:6379/`).
**Impact** : à terme, exfiltration de secrets cloud / accès Redis interne via le bot de modération.
**Correction 🔧** : la `screenImage` ne doit accepter que des URLs **issues du storage** (préfixées par `PUBLIC_FILES_URL` / le bucket connu). Validation explicite côté `ModerationService`.

### B6. Auth manquante sur `/files`

**Lieu** : `apps/api/src/app.ts > app.use('/files', express.static(...))`
**Faille** : les photos uploadées sont servies en static **sans aucun contrôle d'accès**. Le nom de fichier est un UUID v4 (entropie suffisante pour ne pas être deviné), mais :
- Le chemin fuite via la valeur de `photoUrl` côté API
- Aucune révocation : un ancien lien reste valide à vie après suppression du compte (le fichier physique est supprimé, mais des CDN/caches peuvent retenir)
**Impact** : photos « privées par défaut » qui ne sont en fait pas privées — c'est en contradiction directe avec la spec.
**Correction 🔧** : passer par un endpoint authentifié `GET /photos/:userId` qui vérifie la réciprocité du cercle. La photo ne sort jamais en static brut.

### B7. CSRF possible sur les routes d'upload

**Lieu** : `apps/api/src/routes/photos.routes.ts`
**Faille** : on a précédemment dit « pas de CSRF parce qu'on est en JWT en header ». **C'est vrai pour les routes JSON**, faux pour `multipart/form-data` qui peut être envoyé avec un `<form>` HTML cross-origin sans cookie. Si on bascule un jour vers des cookies httpOnly, la route devient exposable.
**Impact** : pour l'instant nul (Bearer header obligatoire), mais piège latent.
**Correction** : documenter que TOUTES les routes mutantes exigent `Authorization: Bearer` — en gros, statu quo, mais à expliciter avant tout passage à des cookies.

---

## 🟠 Important

### I9. Le cron tourne sur toutes les instances en multi-instance

**Lieu** : `apps/api/src/cron/index.ts`
**Faille** : `setInterval` côté Node tourne dans chaque process. Avec N instances déployées, la **push hebdo part N fois** (chaque user reçoit N notifications identiques). Les purges sont moins graves (idempotentes) mais font N fois le travail.
**Impact** : spam de notifs, exactement l'inverse de la promesse « silence numérique respecté ».
**Correction 🔧** : verrou applicatif côté BDD. À chaque exécution, `INSERT IGNORE INTO cron_lock (job_name, acquired_at)` avec contrainte unique sur `job_name` + grace period. Une seule instance gagne le lock par fenêtre.

### I10. La modération auto sur image télécharge l'image deux fois

**Lieu** : `apps/api/src/services/PhotoService.ts`
**Faille** : on stocke d'abord (`storage.put`), puis on demande au classifier de la fetcher via URL. C'est deux I/O au lieu d'une, et surtout : si la modération bloque, l'image est passée brièvement par le storage **en clair**.
**Impact** : fenêtre temporelle où une image potentiellement choquante existe sur le disque/bucket. Court (millisecondes typiquement), mais non nul.
**Correction 🔧** : la `Classifier.classifyImage` doit accepter un **Buffer**, pas une URL. Modération AVANT stockage. Modifier l'interface :

```ts
classifyImage?(buffer: Buffer, mime: string): Promise<ClassificationResult>;
```

Et appeler `screenImageBuffer(...)` avant `storage.put(...)` dans PhotoService.

### I11. Rate limit absent sur `/photos/me` et `/push/devices`

**Lieu** : `apps/api/src/routes/photos.routes.ts`, `push.routes.ts`
**Faille** : un user peut uploader une nouvelle photo 1000 fois en boucle (fait tourner la modération auto, occupe le disque), ou enregistrer 10 000 tokens push factices (pollue la table).
**Impact** : DoS partiel sur les ressources / coûts modération auto en prod.
**Correction 🔧** : `rateLimit` applicatif — 5 uploads/h, 20 enregistrements de device/h.

### I12. `PUBLIC_FILES_URL` permissif par défaut

**Lieu** : `apps/api/src/services/index.ts > LocalFileStorage`
**Faille** : `process.env.PUBLIC_FILES_URL ?? 'http://localhost:4000/files'` — comme `CORS_ORIGIN` initialement, fallback permissif. En prod, si pas configuré, les URLs générées pointent vers `localhost:4000` → photos cassées chez les users.
**Impact** : pas un risque sécurité, mais panne fonctionnelle silencieuse.
**Correction 🔧** : refuser le boot en prod si `PUBLIC_FILES_URL` absent (même politique que I1).

### I13. La photo n'est pas obligatoire au register

**Lieu** : `apps/api/src/routes/auth.routes.ts > registerSchema`
**Faille** : la spec dit « photo obligatoire ». Le register actuel n'exige pas de photo — un user peut s'inscrire et naviguer sans photo. Sur le front, l'écran Profil ne force pas l'upload.
**Impact** : règle métier explicite de la spec non appliquée.
**Correction 🔧** : ajouter dans le `requireAuth` un check « si `photoUrl` est null et la route n'est pas dans une liste blanche (photo upload, logout, états de session), bloquer en 403 avec code `photo_required` ». Le front route alors vers l'écran d'upload obligatoire.

### I14. Tokens push d'un compte supprimé non purgés

**Lieu** : `apps/api/src/repositories/UserRepository.ts > softDelete`
**Faille** : à la suppression d'un compte, les `push_devices` restent (CASCADE est sur `deletedAt`, pas sur soft delete). Pas dramatique parce que `listForUsers` exclut les comptes soft-deleted en pratique via la jointure user, mais c'est de la donnée orpheline.
**Correction 🔧** : appeler `pushDevices.dropForUser(userId)` dans le soft-delete du compte.

---

## 🟡 Mieux

### M9. `User.getAge` accepte des dates invalides silencieusement

**Lieu** : `apps/api/src/entities/User.ts`
**Faille** : `new Date('foobar')` donne `Invalid Date`, `getFullYear()` retourne `NaN`, le calcul renvoie `NaN`. `isAdult()` retourne `false` → en pratique on rejette, mais sans message clair.
**Correction** : `if (Number.isNaN(dob.getTime())) throw new AppError(400, 'Date invalide')`.

### M10. `LocalFileStorage` ne valide pas les magic bytes

**Lieu** : `apps/api/src/lib/storage.ts`
**Faille** : on fait confiance au `Content-Type` envoyé par le client. Un attaquant peut envoyer un `.exe` avec `Content-Type: image/jpeg`. La modération auto ne s'en rendra pas compte (le classifier voit du binaire qu'il ne sait pas classer).
**Impact** : faible — fichier inutilisable, mais pollue le storage.
**Correction** : vérifier les premiers octets (`FF D8 FF` pour JPEG, `89 50 4E 47` pour PNG) avant `storage.put`. Lib `file-type`.

### M11. Aucun test sur la modération et le push

**Lieu** : `apps/api/tests/`
**Faille** : on a couvert User domain, MemoryCache, et le flow login. Mais `ModerationService.handleResults`, `PhotoService.uploadProfilePhoto`, et `PushService.send` sont sans test. Ce sont pourtant les morceaux les plus exposés.
**Correction** : ajouter au minimum `moderation.service.test.ts` (politique FLAG/AUTO_ACTION) et un test du parsing des tickets Expo.

### M12. Le push hebdo ne respecte pas le fuseau de l'user

**Lieu** : `apps/api/src/cron/index.ts > runWeeklyPush`
**Faille** : la fenêtre « lundi 9-11h UTC » envoie en pleine nuit pour certains fuseaux (Asie, Pacifique). Pour Pierre en France c'est 10-12h locales, OK. Pour un user à Tokyo, 18-20h. Pour un user à San Francisco, 1-3h du matin.
**Impact** : notif à 2h du matin = exactement ce qu'on a juré de ne pas faire.
**Correction** : stocker le timezone de chaque user (champ `tz` dans `users`) et envoyer par batch horaire, en ciblant les users dont l'heure locale tombe dans une fenêtre humaine (ex. 9h-20h). Plus complexe — à faire avant tout déploiement public.

### M13. Endpoint Expo en dur

**Lieu** : `apps/api/src/services/PushService.ts > EXPO_API`
**Faille** : URL `exp.host` en constante. Si Expo change l'endpoint (ils l'ont déjà fait), faut redéployer.
**Correction** : `process.env.EXPO_PUSH_URL ?? 'https://exp.host/--/api/v2/push/send'`.

### M14. Pas d'unique sur `links` pour les contacts non inscrits

**Lieu** : `apps/api/src/entities/Link.ts`
**Faille** : la vérification d'unicité côté `LinkRepository.createSafely` est applicative (M2 corrigé), mais il n'y a pas de contrainte de base. Si une migration boguée ou un script SQL contourne le repo, on peut retomber dans les doublons.
**Correction** : index unique partiel impossible en MySQL standard. Solution : `UNIQUE KEY (owner_user_id, member_user_id)` quand `member_user_id IS NOT NULL` — MySQL 8 supporte les index sur expressions, donc on peut avoir un `UNIQUE INDEX uq_owner_member ((CASE WHEN status = 'active' THEN CONCAT(owner_user_id, ':', member_user_id) ELSE NULL END))`. Plus simple pour le MVP : laisser l'unicité applicative.

### M15. Le hibp fail-open n'est pas logué

**Lieu** : `apps/api/src/lib/hibp.ts`
**Faille** : si l'API HIBP est down, on accepte des mots de passe potentiellement compromis. C'est par design (fail-open), mais sans trace.
**Correction** : `console.warn('[hibp] api down — fail-open')` dans le catch, et idéalement métrique pour détecter une indispo prolongée.

---

## 🟢 Hors périmètre / acceptés

- **Endpoint `/files` non versionné** : on n'a pas de migration de chemins prévue. OK.
- **PushService → Expo Push direct, pas APNs/FCM natif** : choix volontaire (un seul provider à intégrer pour iOS+Android+web). Migration possible plus tard si volume.
- **Pas de signature des URLs photo** : pas pertinent tant qu'on passe par un endpoint authentifié (B6).

---

## Priorisation

À traiter avant de montrer l'app à qui que ce soit en dehors de toi :
1. **B6** (auth sur /files) — viole explicitement la promesse produit ✅ **corrigé**
2. **I9** (cron multi-instance) — explose en prod ✅ **corrigé**
3. **I10** (modération avant stockage) — bonne pratique structurante ✅ **corrigé**
4. **I13** (photo obligatoire) — règle métier de la spec 🟡 **partiel** (uploader en place côté front, pas encore enforcement serveur)

## Statut détaillé de cette passe v2

| # | Statut |
|---|---|
| B5 SSRF modération | ✅ corrigé (Buffer au lieu de URL) |
| B6 auth sur /files | ✅ corrigé (GET /photos/:userId authentifié, réciprocité) |
| B7 CSRF latent uploads | 🟢 documenté — non actionnable tant qu'on reste sur Bearer |
| I9 cron multi-instance | ✅ corrigé (CronLock + INSERT atomique) |
| I10 modération avant stockage | ✅ corrigé |
| I11 rate limit photos/push | ✅ corrigé (5/h upload, 20/h devices) |
| I12 PUBLIC_FILES_URL | ✅ caduque (plus d'URL publique) |
| I13 photo obligatoire | 🟡 partiel — manque le middleware `requirePhoto` |
| I14 push devices à la suppression | ✅ corrigé (transaction softDelete) |
| M9 NaN birthdate | ✅ corrigé |
| M10 magic bytes | ✅ corrigé |
| M11 tests modération | ✅ corrigé (`moderation.service.test.ts`) |
| M12 push fuseaux | 🟡 documenté — à faire avant public |
| M13 endpoint Expo en env | ✅ corrigé |
| M14 unique link DB | 🟢 accepté (applicatif suffit au MVP) |
| M15 HIBP fail-open silencieux | ✅ corrigé |

---

## Statut des fixes de l'audit initial

| # | Statut |
|---|---|
| B1 timing attack | ✅ corrigé |
| B2 race 3-max | ✅ corrigé |
| B3 rate limit cluster | 🟡 documenté, TODO prod (Redis) |
| B4 blacklist access | ✅ corrigé (MemoryCache, à passer Redis en prod) |
| I1 CORS strict | ✅ corrigé |
| I2 verrou compte | ✅ corrigé |
| I3 limite 5 sessions | ✅ corrigé |
| I4 cleanup expirés | ✅ corrigé (cron) |
| I5 HIBP | ✅ corrigé |
| I6 logging échecs | ✅ corrigé |
| I7 nudges fantômes | ✅ corrigé |
| I8 SecureStore Android | 🟡 documenté |
| M1 âge 29 fév | ✅ corrigé |
| M2 unicité contact | ✅ corrigé (applicatif) |
| M3 pagination journal | ✅ corrigé |
| M4 timeout fetch | ✅ corrigé |
| M5 NetworkError | ✅ corrigé |
| M6 retry conditionnel | ✅ corrigé |
| M7 logout intempestif | ✅ corrigé |
| M8 rate limit écritures | 🟡 partiel (reports OK, photos/push à faire — I11) |
