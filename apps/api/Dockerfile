# Image de production pour cercle-api (Aparté).
# Contexte de build attendu : la racine du monorepo.
#   docker build -f apps/api/Dockerfile -t aparte-api:latest .

FROM node:20-alpine AS base
ENV COREPACK_HOME=/opt/corepack \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# --- Étape build : installe tout le workspace et compile l'API ---
FROM base AS build
WORKDIR /repo
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json .npmrc ./
COPY apps/api/package.json apps/api/package.json
COPY apps/app/package.json apps/app/package.json
RUN pnpm install --frozen-lockfile
COPY apps/api apps/api
RUN pnpm --filter cercle-api build
RUN pnpm --filter cercle-api deploy --prod /prod/api

# --- Étape runtime : image minimale, utilisateur non-root ---
FROM base AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /prod/api/node_modules ./node_modules
COPY --from=build /prod/api/package.json ./package.json
COPY --from=build /repo/apps/api/dist ./dist

RUN addgroup -S aparte && adduser -S aparte -G aparte \
    && mkdir -p uploads && chown -R aparte:aparte /app "$COREPACK_HOME"

USER aparte
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||4000)+'/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "dist/server.js"]
