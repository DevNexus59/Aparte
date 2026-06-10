# Cercle — API

Backend **Express + TypeScript + TypeORM (MySQL)** pour le MVP « Cercle ».
Architecture **POO en couches** : entities → repositories → services → routes.

## Démarrage

```bash
cp .env.example .env       # remplir DB_* et régénérer les secrets JWT
npm install
npm run dev                # http://localhost:4000
npm test                   # tests unitaires (vitest)
```

En dev, `synchronize: true` dans TypeORM crée/met à jour les tables au démarrage à partir des entities. En prod : `synchronize: false` + migrations.

## Architecture

```
src/
  config/data-source.ts    # DataSource TypeORM + naming snake_case
  entities/                # 12 classes @Entity = modèle de données
  repositories/            # 9 repositories héritant de BaseRepository<T>
  services/                # logique métier en classes
    AuthService            # B1, B4, I2, I5, I6 intégrés
    HeartbeatService       # boucle prompt -> journal -> nudge en transaction
    LinkService            # façade : la logique sensible vit dans le repo (B2, M2, I7)
    EmotionalStateService
    ModerationService      # classification auto (Strategy), signalement, sanctions
    PhotoService           # upload + modération auto + remplacement ancien
  routes/                  # Express + Zod + asyncHandler
  middlewares/             # auth (avec check blacklist B4), errorHandler
  lib/
    cache, hibp, jwt, moderation, pagination, password, storage
  cron/                    # purges périodiques (refresh tokens, états expirés)
  app.ts                   # helmet, CORS strict, statiques /files, rate limit
  server.ts                # init séquentielle : DataSource -> Repos -> Services -> Cron -> HTTP
tests/                     # vitest (User domain, MemoryCache, AuthService)
```

## Endpoints

| Méthode | Route | Description |
|---|---|---|
| POST | `/auth/register` | Inscription (age-gate 18+, HIBP, MDP ≥ 12) |
| POST | `/auth/login` | Login (DUMMY_HASH, verrou 5 échecs) |
| POST | `/auth/refresh` | Rotation des tokens |
| POST | `/auth/logout` | Révoque refresh + blackliste access |
| POST | `/auth/logout-all` | Déconnecte toutes les autres sessions |
| GET | `/heartbeat/prompt` | Question de la semaine |
| GET/POST | `/heartbeat/journal` | Liste paginée + ajout (crée un nudge si linkId) |
| GET/PATCH | `/heartbeat/nudges` | Relances en attente |
| GET/POST/PATCH/DELETE | `/links` | Le Cercle (3 max) |
| GET/PUT/DELETE | `/states/me` | Mon état émotionnel |
| GET | `/states/circle` | États du Cercle réciproque |
| POST | `/moderation/reports` | Signaler (rate-limité 10/h) |
| GET/PATCH | `/moderation/reports` | File de revue (mod+) |
| POST | `/moderation/actions` | Sanctions (mod+) |
| POST | `/photos/me` | Upload photo de profil (multipart, ≤ 5 Mo) |

## Fixes de l'audit — état d'intégration

| # | Sujet | Implémentation |
|---|---|---|
| B1 | Timing attack login | `DUMMY_HASH_PROMISE` dans `AuthService` |
| B2 | Race 3-max | Transaction SERIALIZABLE dans `LinkRepository.createSafely` |
| B3 | Rate limit cluster | TODO prod : remplacer `MemoryCache` + `express-rate-limit` mémoire par Redis |
| B4 | Blacklist access tokens | `jti` JWT + check dans `requireAuth` via `MemoryCache` |
| I1 | CORS strict prod | `CORS_ORIGIN` obligatoire, throw au boot sinon |
| I2 | Verrou compte | `User.isLocked()` + `UserRepository.registerFailedLogin` |
| I3 | Limite 5 sessions | `RefreshTokenRepository.issue` révoque les plus anciennes |
| I4 | Cleanup expirés | `src/cron/index.ts` — refresh tokens 7j+ et états 30j+ |
| I5 | HIBP | `isPasswordPwned` appelée dans `AuthService.register` |
| I6 | Logging échecs | `AuditLogRepository.record` sur chaque login |
| I7 | Nudges fantômes | `LinkRepository.softRemove` dismisse les nudges en transaction |
| M1 | Âge 29 fév | `User.getAge` corrigé |
| M2 | Unicité contact | Vérification dans `LinkRepository.createSafely` |
| M3 | Pagination journal | `JournalEntryRepository.listForUser` cursor-based |
| M8 | Rate limit écritures | `reportLimiter` sur POST /moderation/reports |

## Encore à faire avant prod

- Remplacer `MemoryCache` par `RedisCache` (B3, B4 partagés multi-instance)
- Remplacer `NoopClassifier` par de vrais classifieurs (OpenAI Moderation, AWS Rekognition…)
- Remplacer `LocalFileStorage` par `S3Storage` / Supabase Storage
- Générer la première migration : `npm run typeorm migration:generate -- src/migrations/Initial`
- Régénérer `JWT_ACCESS_SECRET` et `JWT_REFRESH_SECRET` (`openssl rand -hex 64`)
- HTTPS obligatoire (reverse proxy)

## Patron POO à recopier

```
1. Entity (src/entities/X.ts)         tab le + règles domain
2. Repository (src/repositories/X.ts) accès BDD, transactions
3. Service (src/services/X.ts)        logique métier
4. Route (src/routes/x.routes.ts)     Zod + asyncHandler + appel service
```
