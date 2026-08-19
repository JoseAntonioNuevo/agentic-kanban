FROM oven/bun:1.3.14

WORKDIR /app

COPY package.json bun.lock ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/schemas/package.json packages/schemas/package.json

RUN bun install --frozen-lockfile

COPY . .

ENV DATABASE_URL=file:/data/agentic-kanban.db
ENV API_PORT=3000

EXPOSE 3000

CMD ["bun", "run", "--hot", "apps/api/src/index.ts"]
