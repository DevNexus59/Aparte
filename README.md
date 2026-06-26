# Aparté

> Trois contacts. Pas plus.

Application mobile minimaliste anti-dopamine — pas de fil d'actualité, pas de likes, pas d'algorithme de recommandation. Juste les trois personnes qui comptent vraiment.

Projet personnel développé en solo avec l'assistance de **Claude Code**.

---

## Concept

La plupart des apps sociales sont optimisées pour maximiser le temps passé. Aparté fait l'inverse : une contrainte dure de 3 contacts, un design épuré, zéro mécanique de rétention.

- **3 contacts maximum** — choisis intentionnellement
- **Pas de score, pas de streak, pas de notification compulsive**
- **Push hebdomadaire** — un seul prompt le lundi pour prendre des nouvelles
- **Design orb animé** — respiration visuelle, pas de barre de navigation classique

---

## Stack

| Couche | Technologie |
|--------|-------------|
| Mobile | React Native · Expo SDK 54 · React 19.1 · RN 0.81 |
| Animations | Reanimated v4 · react-native-worklets |
| Backend | NestJS · TypeORM · MySQL |
| Auth | JWT · Argon2 |
| Push | Expo Push API · cron lundi 9h–11h UTC |
| Monorepo | pnpm workspaces (node-linker=hoisted) |
| Fonts | Newsreader · Hanken Grotesk · Geist Mono |

---

## Architecture monorepo

```
aparte/
├── apps/
│   ├── mobile/          # Expo app (React Native)
│   └── api/             # NestJS backend
├── packages/
│   └── shared/          # Types & utils partagés
├── pnpm-workspace.yaml
└── package.json
```

---

## Fonctionnalités

- **Auth** — inscription / connexion JWT, hash Argon2, refresh token
- **Aparté** — sélection et gestion des 3 contacts
- **Constellation** — layout SVG animé des contacts
- **Orb** — composant de respiration visuelle (Reanimated v4)
- **Push notifications** — cron hebdomadaire via Expo Push API
- **Upload avatar** — validation magic bytes (JPEG / PNG / WebP)
- **TabBar SVG** — navigation custom sans librairie tierce

---

## Installation

### Prérequis

- Node 20+
- pnpm 9+
- MySQL 8+
- Expo Go (Android) ou build dev

### Setup

```bash
git clone https://github.com/DevNexus59/aparte.git
cd aparte
pnpm install
```

### Variables d'environnement

```bash
# apps/api/.env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=aparte
DB_USER=aparte
DB_PASS=...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
```

### Lancer

```bash
# API
pnpm api:dev

# App mobile
pnpm app:start
```

---

## Design

Palette ambrée sur fond sombre — typographie variable, animations fluides, zéro élément superflu.

- **Couleurs** — amber/dark, pas de couleur primaire criarde
- **Philosophie** — chaque pixel justifié, rien par défaut

---

## Statut

> En développement actif — bêta testeurs recherchés (Android).

---

## Auteur

**Pierre Fourdin** — [pierrefourdin.dev](https://pierrefourdin.dev) · [GitHub @DevNexus59](https://github.com/DevNexus59)
