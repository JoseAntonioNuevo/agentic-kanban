# Imagen oficial de Vite+ deniega pulls sin auth.
# Bun 1.4.3 + vite-plus@1.3.0 del workspace: el frontend sigue yendo por Vite+.
FROM oven/bun:1.4.3

WORKDIR /app

# Manifests primero para cachear la instalación.
# bunfig.toml tiene que ir antes del install: sin `linker = "hoisted"`
# Bun 1.4 deja las deps en cada paquete y el bind-mount las tapa.
COPY package.json bun.lock bunfig.toml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/schemas/package.json packages/schemas/package.json

RUN bun install --frozen-lockfile

COPY . .

ENV API_PROXY_TARGET=http://api:3000

EXPOSE 5173

CMD ["bun", "x", "vp", "dev", "apps/web", "--host", "0.0.0.0", "--port", "5173"]
