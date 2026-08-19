# ghcr.io/voidzero-dev/vite-plus:0.2.9 is the official toolchain image,
# but unauthenticated pulls are denied. Bun 1.3.14 + pinned vite-plus@0.2.9
# still runs the web app through Vite+, not standalone Vite.
FROM oven/bun:1.3.14

WORKDIR /app

COPY package.json bun.lock ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/schemas/package.json packages/schemas/package.json

RUN bun install --frozen-lockfile

COPY . .

ENV API_PROXY_TARGET=http://api:3000

EXPOSE 5173

CMD ["bun", "x", "vp", "dev", "apps/web", "--host", "0.0.0.0", "--port", "5173"]
