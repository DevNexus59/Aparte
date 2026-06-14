# Google Play Console — Fiche « Contenu de l'application »

Ce document donne, pour chaque section du menu **Play Console → Votre
application → Règles → Contenu de l'application**, les réponses prêtes à
recopier pour **Aparté** (`com.aparte.app`). Basé sur l'audit du code
(`apps/api/src/entities`, routes, `apps/app`) au 13 juin 2026 — à
mettre à jour si la collecte de données évolue.

> Pré-requis techniques livrés avec ce document :
> - `GET /legal/confidentialite` et `GET /legal/suppression-compte` (API),
>   accessibles publiquement sur
>   `https://aparte.pierrefourdin.dev/legal/confidentialite` et
>   `https://aparte.pierrefourdin.dev/legal/suppression-compte` une fois
>   déployées — couvrent **D3** et **D4** de
>   [`05-publication-play-store.md`](./05-publication-play-store.md).
> - Contact RGPD : `devnexus59@gmail.com`.

---

## 1. Décrire le contenu de votre application

Section purement informative (aperçu des autres sections). Rien à remplir
ici directement — passe aux sections ci-dessous.

---

## 2. Définir les règles de confidentialité

**Champ « URL de la politique de confidentialité »** :

```
https://aparte.pierrefourdin.dev/legal/confidentialite
```

Le contenu de cette page (texte RGPD complet en français) est généré par
`apps/api/src/routes/legal.routes.ts` — rien à rédiger côté store, juste
coller l'URL une fois l'API déployée avec ce changement.

---

## 3. Informations de connexion (App access)

Google doit pouvoir tester les fonctionnalités nécessitant un compte.

- **Toutes les fonctionnalités nécessitent-elles une connexion ?** Oui.
- **Identifiants de test** : le compte de test est créé/synchronisé
  automatiquement au démarrage de l'API à partir des variables
  `GOOGLE_REVIEW_EMAIL` / `GOOGLE_REVIEW_PASSWORD` du `.env`
  (`apps/api/src/lib/seedReviewAccount.ts`). Il est marqué comme email
  vérifié, ce qui le protège de la purge automatique des comptes non
  confirmés après 24h. Renseigner dans la Play Console :
  - Nom d'utilisateur : la valeur de `GOOGLE_REVIEW_EMAIL`
  - Mot de passe : la valeur de `GOOGLE_REVIEW_PASSWORD`
  - Instructions complémentaires (champ libre) :
    > « Compte de test fonctionnel. L'application est un réseau social
    > privé limité à un "cercle" de 3 proches maximum ; le compte de test
    > est vide (aucune relation), ce qui est un état normal de l'app —
    > toutes les fonctionnalités (journal, état émotionnel, ajout de
    > présence) restent accessibles sans relation existante. »

> ⚠️ À faire manuellement : définir `GOOGLE_REVIEW_EMAIL` et
> `GOOGLE_REVIEW_PASSWORD` dans le `.env` de production avant la revue —
> le compte est ensuite créé/maintenu automatiquement à chaque démarrage de
> l'API.

---

## 4. Annonces (Ads)

**Réponse : « Non, mon application ne contient pas d'annonces. »**

Vérifié dans `apps/app/package.json` : aucun SDK publicitaire
(`react-native-google-mobile-ads`, AdMob, etc.) n'est installé. Voir
[`05-publication-play-store.md`](./05-publication-play-store.md) section C
si une intégration pub est ajoutée plus tard — il faudra revenir sur cette
réponse **et** sur le formulaire Data Safety (section 7 ci-dessous).

---

## 5. Classification du contenu (questionnaire IARC)

À remplir dans Play Console (questionnaire dynamique, catégorie
« Réseau social / Utilitaire »). Réponses recommandées, en cohérence avec
le produit (messagerie privée entre membres d'un cercle restreint,
modération a posteriori via signalement) :

| Question type IARC | Réponse pour Aparté | Justification |
|---|---|---|
| Violence | Aucune | Pas de contenu violent généré ou autorisé |
| Contenu sexuel | Aucun proposé par l'app | UGC non modéré a priori, mais signalement existe (`ModerationFlag`, `Report`) |
| Langage grossier | Peut apparaître (UGC) | Messages/journal en texte libre entre utilisateurs |
| Contenu contrôlé (drogue, alcool, tabac) | Aucun | Non thématisé par l'app |
| Interactions entre utilisateurs | **Oui** — messagerie privée non modérée en amont | Cocher "les utilisateurs peuvent interagir" et "l'app partage la position" → **Non** (pas de géoloc) |
| Partage de la position | Non | Aucune collecte de géolocalisation dans le code |
| Achats numériques | Non | Aucune intégration paiement (`package.json` API/app) |

→ Avec ces réponses, l'app obtient généralement une classification **PEGI
12 / 16** selon les régions, en raison de la messagerie utilisateur non
modérée a priori. C'est cohérent avec l'âge minimum **18 ans imposé à
l'inscription** (`AuthService.deleteAccount`/`isAdult()`), qui est *plus
restrictif* que la classification de contenu — pas de contradiction.

---

## 6. Cible et contenu (Target audience)

- **Tranches d'âge ciblées** : cocher **uniquement 18 ans et plus**.
  L'inscription est techniquement bloquée sous 18 ans
  (`apps/api/src/services/AuthService.ts` : *"Inscription réservée aux 18
  ans et plus"*).
- **Cette application intéresse-t-elle particulièrement les enfants ?**
  Non.
- **Programme "Designed for Families"** : ne pas y inscrire l'app (cohérent
  avec D6 de `05-publication-play-store.md`).
- **Page de destination pour les enfants requise ?** Non (app 18+).

---

## 7. Sécurité des données (Data safety)

C'est la section la plus longue. Le tableau ci-dessous mappe chaque type de
donnée Play Console aux données réellement collectées par Aparté (vérifié
dans `apps/api/src/entities/*.ts`).

### Collecte et partage

**Cette application collecte-t-elle ou partage-t-elle des données
utilisateur ?** → **Oui, collecte uniquement** (aucun partage avec un tiers
— pas de SDK publicitaire/analytics).

### Détail par catégorie Play

| Catégorie Play | Type | Collectée ? | Partagée ? | Obligatoire ? | Finalité (cocher) | Donnée source |
|---|---|---|---|---|---|---|
| **Informations personnelles** | Adresse e-mail | Oui | Non | Oui | Fonctionnalité de l'app, Gestion du compte | `User.email` |
| **Informations personnelles** | Nom (prénom/surnom) | Oui | Non | Oui | Fonctionnalité de l'app | `User.displayName` |
| **Informations personnelles** | Numéro de téléphone | Oui | Non | Non | Fonctionnalité de l'app | `User.phone`, `Link.contactPhone` |
| **Informations personnelles** | Autres infos (date de naissance) | Oui | Non | Oui | Fonctionnalité de l'app (vérif. âge) | `User.birthdate` |
| **Photos ou vidéos** | Photos | Oui | Non | Non | Fonctionnalité de l'app | `User.photoUrl` (photo de profil) |
| **Messages** | Messages dans l'app | Oui | Non | Non | Fonctionnalité de l'app | `Message` (chiffré au repos AES-256-GCM) |
| **Activité dans l'application** | Autre contenu généré par l'utilisateur | Oui | Non | Non | Fonctionnalité de l'app | `JournalEntry`, `EmotionalState` |
| **Identifiants de l'appareil ou autres** | Identifiants de l'appareil | Oui | Non | Non | Fonctionnalité de l'app (notifications) | `PushDevice.token`, `deviceInfo` |
| **Informations sur l'application** | Journaux d'erreurs / diagnostics | Non | — | — | — | Pas de crash reporting tiers (Sentry, etc.) |
| **Position** | Position approximative/précise | **Non** | — | — | — | Aucune collecte de géolocalisation dans le code |
| **Données financières** | — | Non | — | — | — | Aucun paiement |
| **Santé et fitness** | — | Non | — | — | — | — |

Pour chaque ligne « Oui », Play demandera aussi :

- **« Les utilisateurs peuvent-ils demander la suppression de ces
  données ? »** → **Oui** pour toutes les catégories (suppression de compte
  in-app + page web, voir section 2).
- **« Cette donnée est-elle chiffrée en transit ? »** → **Oui** (HTTPS
  partout, `app.ts` force CORS + TLS en prod).
- **« Cette collecte est-elle facultative ? »** → Oui pour téléphone et
  photo (champs optionnels côté formulaire), Non pour email/nom/date de
  naissance (requis à l'inscription).

### Pratiques de sécurité (section dédiée du formulaire)

- **Les données sont-elles chiffrées en transit ?** Oui.
- **Pouvez-vous demander la suppression de vos données ?** Oui (in-app +
  page web `/legal/suppression-compte`).
- **L'application respecte-t-elle la politique Families ?** Non applicable
  (app 18+, pas dans le programme Families).
- **Un tiers a-t-il vérifié vos pratiques de sécurité ?** Non (pas
  d'audit externe formel à ce stade — laisser décoché).

---

## 8. Applis gouvernementales

**Réponse : « Non, cette application n'est pas développée par ou pour le
compte d'une entité gouvernementale. »**

---

## 9. Fonctionnalités financières

**Réponse : « Mon application ne propose pas de fonctionnalités
financières. »**

Aucune intégration de paiement, prêt, assurance, courtage ou crypto-actif
dans `apps/api` ou `apps/app`.

---

## 10. Santé

**Réponse : « Non, mon application ne traite pas de données de santé. »**

Les "états émotionnels" (`EmotionalState` : disponible / envie de voir /
besoin de parler / fatigué·e socialement) sont un signal social de
disponibilité, pas une donnée de santé mentale au sens de la classification
Play (pas de diagnostic, suivi médical, ou donnée de santé déclarée comme
telle). Si Google requalifie ce point lors de la revue, revoir cette
réponse et la section Data Safety (catégorie « Santé et fitness »).

---

## Récapitulatif des actions avant soumission

| # | Action | Qui |
|---|---|---|
| 1 | Déployer l'API avec `legal.routes.ts` (ce changement) | toi (déploiement) |
| 2 | Coller l'URL politique de confidentialité dans Play Console | toi |
| 3 | Créer le compte de test pour la section "Informations de connexion" | toi |
| 4 | Remplir le questionnaire IARC avec le tableau de la section 5 | toi |
| 5 | Remplir Data Safety avec le tableau de la section 7 | toi |
| 6 | Répondre "Non" aux sections Ads, Gouvernement, Finance, Santé | toi |
