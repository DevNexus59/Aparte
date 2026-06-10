# Cercle — monorepo

> Sanctuaire relationnel minimaliste — 3 personnes proches, anti-dopamine, design system Aube.

Monorepo géré avec **pnpm workspaces** (recommandation officielle Expo pour les monorepos React Native).

## Structure

```
cercle/
├── apps/
│   ├── api/          Backend Express + TypeORM (MySQL) + POO en couches
│   └── app/          Front React Native + Expo Router + NativeWind
└── docs/             Spec produit, archi, audits sécurité
```

## Démarrage

```bash
# Installer pnpm si ce n'est pas fait
npm install -g pnpm

# Installer toutes les deps du monorepo
pnpm install

# Backend
pnpm api:dev          # http://localhost:4000
pnpm api:test

# Front (Expo SDK 54)
pnpm app:start        # puis i / a / w
```

## Pourquoi pnpm

Les monorepos npm workspaces marchent mal avec Expo/RN à cause de la résolution des dépendances transitives. pnpm avec `node-linker=hoisted` (cf `.npmrc`) installe tout en un seul `node_modules/` (comme npm) mais avec un système de résolution plus prévisible. Aucune différence visible côté code.

## Pour la présentation (DP)

Ordre de lecture des docs :
1. `docs/01-spec-mvp.md` — vision & spec produit
2. `docs/02-architecture-bdd.md` — archi technique + schéma ER
3. `apps/api/README.md` + `apps/app/README.md` — détails techniques
4. `docs/03-audit-initial.md` + `docs/04-audit-v2.md` — sécurité, traçable
