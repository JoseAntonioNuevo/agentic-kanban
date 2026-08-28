# API: Bun 1.4.0. Instala el monorepo y arranca Hono con --hot.
FROM oven/bun:1.4.0

WORKDIR /app

# Primero los manifests para cachear node_modules entre builds.
# bunfig.toml tiene que ir antes del install: sin `linker = "hoisted"`
# Bun 1.4 deja las deps en cada paquete y el bind-mount las tapa.
COPY package.json bun.lock bunfig.toml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/schemas/package.json packages/schemas/package.json

RUN bun install --frozen-lockfile

# El código se bind-montea en runtime; esta COPY vale para la imagen base.
COPY . .

ENV DATABASE_URL=file:/data/agentic-kanban.db
ENV API_PORT=3000

EXPOSE 3000

CMD ["bun", "run", "--hot", "apps/api/src/index.ts"]
