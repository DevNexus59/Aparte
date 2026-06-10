# Cercle — App (Expo)

Front React Native + Expo Router + TanStack Query + Zustand.
Cible iOS, Android, Web. TypeScript strict, alias `@/*` vers `src/`.

## Démarrage

```bash
npm install
npm start             # i (iOS) / a (Android) / w (web)
```

L'API est lue depuis `expo.extra.apiUrl` dans `app.json` (défaut `http://localhost:4000`).

## Parcours

```
register -> onboarding -> (app)
                            |- index    Battement : mon état, états du cercle, question hebdo
                            |- circle   Le Cercle (3 max) + ajouter / retirer / signaler
                            |- journal  Liste paginée des entrées
                            |- profile  Photo de profil + déconnexion
```

## Structure

```
app/
  _layout.tsx                # Query client, fonts, AuthGate (3 états)
  index.tsx                  # redirection neutre
  onboarding.tsx             # « pourquoi tu es là ? »
  (auth)/login.tsx, register.tsx
  (app)/_layout.tsx          # tabs + usePushRegistration
  (app)/index.tsx            # Battement
  (app)/circle.tsx, journal.tsx, profile.tsx
src/
  components/                # Button, Card, Input, Text, DateField, StateBadge,
                             # MyStatePicker, CircleStates, ReportSheet, ProfilePhotoUploader
  hooks/                     # auth, links, heartbeat, states, moderation, push
  lib/                       # api (M4/M5/M7), age (M1), time, storage, cn
  stores/auth.ts             # Zustand : tokens + hydratation SecureStore
  theme/tokens.ts            # palette + états (parallèle de tailwind.config.js)
tailwind.config.js           # design system « Aube » dark
```

## Fixes côté front

| # | Sujet | Lieu |
|---|---|---|
| M1 | Âge 29 fév | `src/lib/age.ts` |
| M4 | Timeout API | `AbortController` dans `src/lib/api.ts` |
| M5 | `NetworkError` ≠ `ApiError` | `src/lib/api.ts` + `errorMessage` |
| M6 | Retry conditionnel | QueryClient dans `app/_layout.tsx` |
| M7 | Pas de logout sur erreur réseau | `doRefresh` dans `src/lib/api.ts` |

## Push notifications

`usePushRegistration` (dans le layout des onglets) demande la permission une seule fois après la 1re connexion. Configuration :
- `shouldPlaySound: false`, `shouldSetBadge: false` — silence numérique respecté
- À brancher : `POST /users/me/push-token` côté API (TODO marqué dans `src/hooks/push.ts`)

## Design system

Voir `tailwind.config.js` pour tous les tokens. Référence rapide :
- **Fond** `#0E1217`, surface `#171C23`, élevée `#1F2530`
- **Accent Aube** `#C9A584` — la seule couleur vive
- **États** : ambre, bleu-gris, sauge, rose poudré — tous désaturés
- **Typo** : Inter 300 / 400 / 500 — display, title, body-l, body, caption
- **Radius** : 8 / 16 / 24 / pill
