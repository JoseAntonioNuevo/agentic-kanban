# API de producción para Cloudflare Containers (Bun 1.4.3).
#
# Contexto de build: la raíz del monorepo (`image_build_context: "../.."` en
# wrangler.jsonc), así que las rutas son relativas a la raíz. El
# .dockerignore de la raíz deja fuera .env, .env.*, *.local y data/.
#
# Sin --hot ni bind mount. Al arrancar aplica las migraciones, ejecuta el
# seed y levanta la API. El disco de Containers es efímero: cada arranque
# parte del seed y los cambios se pierden cuando el contenedor duerme.
FROM oven/bun:1.4.3

WORKDIR /app

# Manifests de todos los paquetes del workspace antes del install: así
# `--frozen-lockfile` valida el bun.lock completo. bunfig.toml fija
# `linker = "hoisted"`.
COPY package.json bun.lock bunfig.toml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/edge/package.json apps/edge/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/schemas/package.json packages/schemas/package.json

# Solo las dependencias de la API y sus paquetes internos (drizzle-kit
# incluido: lo usa db:migrate). Ni Vite+ ni wrangler entran en la imagen.
RUN bun install --frozen-lockfile \
  --filter @agentic-kanban/api \
  --filter @agentic-kanban/db \
  --filter @agentic-kanban/schemas

COPY tsconfig.base.json ./
COPY packages packages
COPY apps/api apps/api

# La base vive fuera de /app, como en Compose.
RUN mkdir -p /data && chown bun:bun /data
USER bun

ENV NODE_ENV=production
ENV DATABASE_URL=file:/data/agentic-kanban.db
ENV API_PORT=3000

EXPOSE 3000

CMD ["sh", "-c", "bun run db:migrate && bun run db:seed && exec bun run apps/api/src/index.ts"]
