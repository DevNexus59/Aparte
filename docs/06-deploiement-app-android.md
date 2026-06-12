# Déploiement app Android — EAS + Google Play (test interne)

Ce document explique comment builder l'app **Aparté** (`apps/app`) avec
**Expo Application Services (EAS)** et la déposer sur la piste **Internal
testing** de Google Play, pour des tests dev/QA avant publication publique.

> Pour la checklist complète avant une publication publique sur le Play
> Store (politique de confidentialité, permissions, etc.), voir
> [`docs/05-publication-play-store.md`](./05-publication-play-store.md).
> Ce document-ci ne couvre que le **test interne**.

## 0. Prérequis

- Un compte Expo (gratuit) : https://expo.dev/signup
- Un compte développeur Google Play (frais unique de 25 $) :
  https://play.google.com/console/signup
- `apps/app/eas.json` (déjà créé dans ce repo) avec 3 profils :
  `development`, `preview`, `production`.

## 1. Connexion EAS

> ⚠️ **Toutes les commandes `eas` de ce document doivent être lancées
> depuis `apps/app`**, pas depuis la racine du monorepo. Lancée depuis la
> racine, EAS Build résout le projet à la racine (`package.json` de
> `cercle`, sans champ `main`), et le bundling Android échoue avec
> `Unable to resolve module ../../App from .../node_modules/expo/AppEntry.js`
> (avec `node-linker=hoisted`, `apps/app/node_modules` n'existe pas, donc
> rien n'indique à EAS que `apps/app` est la racine du projet Expo).

Depuis `apps/app` :

```bash
npx eas-cli@latest login
```

> `npx eas` seul échoue avec `could not determine executable to run` : le
> paquet npm s'appelle `eas-cli` (il expose juste la commande `eas`), donc
> il faut soit `npx eas-cli@latest ...`, soit l'installer
> (`pnpm add -D eas-cli` dans `apps/app`) pour pouvoir faire `npx eas ...`.

Si ce n'est pas déjà fait, lie le projet local à un projet Expo distant :

```bash
npx eas-cli@latest build:configure
```

Cette commande peut ajouter un champ `extra.eas.projectId` à `app.json` —
c'est normal et sans rapport avec le diff local existant sur
`extra.apiUrl` (voir `app.config.js`, qui surcharge uniquement `apiUrl`).

## 2. Comprendre `eas.json` et `app.config.js`

`apps/app/eas.json` définit 3 profils de build, chacun avec une variable
d'env `EXPO_PUBLIC_API_URL` :

- `development` → `http://localhost:4000` (dev local avec Expo Dev Client)
- `preview` → `https://aparte.pierrefourdin.dev` (build de test interne, pointe
  vers l'API de prod déployée — voir
  [`docs/07-deploiement-infra-k8s.md`](./07-deploiement-infra-k8s.md))
- `production` → `https://aparte.pierrefourdin.dev`

`apps/app/app.config.js` lit cette variable d'env au moment du build et
surcharge `extra.apiUrl` (normalement défini dans `app.json`, qui garde sa
valeur de dev local `http://192.168.1.87:4000` non committée). L'app lit
`Constants.expoConfig?.extra?.apiUrl` (`apps/app/src/lib/api.ts`), donc un
build `preview`/`production` pointera automatiquement vers l'API publique
sans toucher à `app.json`.

## 3. Lancer un build de test interne (AAB)

```bash
npx eas-cli@latest build --platform android --profile preview
```

- Le profil `preview` produit un **AAB** (`android.buildType: app-bundle`).
  Play Console refuse désormais les APK pour toute nouvelle app, y compris
  sur la piste "Internal testing" (message "Importez un app bundle
  valide") — d'où ce choix, identique au profil `production`.
- EAS gère la signature automatiquement (keystore généré et stocké côté
  Expo si c'est le premier build — choisis "Generate new keystore" quand
  proposé).
- À la fin du build, EAS fournit un lien de téléchargement de l'AAB.

## 4. Créer l'app dans Google Play Console

1. Play Console → **Créer une application**.
2. Nom : `Aparté`, langue par défaut : français, type : Application,
   gratuite.
3. Renseigner le **nom du package** : `com.aparte.app` (doit correspondre
   à `apps/app/app.json > android.package`).
4. Compléter le strict minimum requis pour activer une piste de test
   (déclaration de contenu, classification, coordonnées) — la checklist
   complète pour la **publication publique** (politique de confidentialité,
   permissions sensibles, etc.) est dans
   [`docs/05-publication-play-store.md`](./05-publication-play-store.md) et
   n'est **pas bloquante pour le test interne**.

### Activer Play App Signing

Lors du premier upload (ou dans **Production → Intégrité de
l'application**), accepte **Play App Signing** : Google gère la clé de
signature finale, EAS gère la clé d'upload. Aucune action manuelle
supplémentaire n'est requise.

## 5. Téléverser le build sur la piste "Internal testing"

1. Play Console → **Tester → Tests internes** → **Créer une version**.
2. Téléverser l'AAB généré à l'étape 3.
3. Renseigner les notes de version (ex. "Build de test interne — Aparté").
4. Enregistrer puis **Vérifier la version** → **Lancer le déploiement vers
   les testeurs internes**.

## 6. Ajouter des testeurs internes

1. Play Console → **Tester → Tests internes → Testeurs**.
2. Créer une liste d'emails (ou utiliser un groupe Google existant) avec
   les adresses Gmail des testeurs.
3. Copier le **lien d'opt-in** fourni et l'envoyer aux testeurs — ils
   doivent l'ouvrir et accepter avant de pouvoir installer l'app via le
   Play Store.

## 7. Itérer

À chaque nouvelle version à tester :

```bash
npx eas-cli@latest build --platform android --profile preview
```

puis répéter l'étape 5 (nouvelle version sur la piste Internal testing).
`appVersionSource: "remote"` (dans `eas.json`) fait incrémenter
automatiquement le `versionCode` Android à chaque build, donc pas de
conflit de version sur Play Console.

## 8. Vers la production

Pour un build `production` (AAB, destiné à une piste publique ou fermée
plus large) :

```bash
npx eas-cli@latest build --platform android --profile production
```

Avant de soumettre ce build à une revue Google Play publique, traiter les
items 🔴/🟠 de
[`docs/05-publication-play-store.md`](./05-publication-play-store.md)
(politique de confidentialité, URL API HTTPS publique — déjà couverte par
le déploiement k8s, etc.).
