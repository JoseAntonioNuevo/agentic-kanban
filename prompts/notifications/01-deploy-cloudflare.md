# Sesión 4 · 01 — Publicar en Cloudflare lo que ya funciona

## Punto de partida

Las Sesiones 1 a 3 están completas: auth y tenants, tablero con
drag-and-drop y tiempo real por WebSocket con toasts. Todo corre en local con
Compose (`web` y `api`). Todavía no hay comentarios, menciones ni email, y la
app no está publicada.

## Objetivo

Publicar **ya** el tablero de la clase 3 en
`https://thepower-kanban.josenuevo.dev`: un Worker sirve el frontend y reenvía
`/api/*` (HTTP y WebSocket) a un Container con la misma API de Bun. Desde aquí,
cada funcionalidad nueva llega a producción con `bun run deploy:cloudflare`.
Desplegar primero descubre a tiempo los problemas de cuenta, dominio, imagen y
WebSocket, y deja hecho el aprovisionamiento lento del primer deploy.

## Contratos que fijas aquí

- `apps/edge`: Worker con `wrangler.jsonc`, `src/index.ts` con la clase
  `ApiContainer` (de `@cloudflare/containers`) y un Dockerfile de producción
  de la API.
- Script `deploy:cloudflare` en el `package.json` raíz: construye la web y
  ejecuta `wrangler deploy` con los secretos de `.env.cloudflare.local`.
- `.env.cloudflare.local` (Git lo ignora por `*.local`; ya lo preparó el
  profesor): `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`
  (`https://thepower-kanban.josenuevo.dev`) y las cuatro variables de correo
  (`CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_EMAIL_TOKEN`, `MAIL_FROM`,
  `MAIL_REDIRECT_TO=jose@josenuevo.dev`), que no se usan hasta el 06. No
  muestres su contenido (ni con `cat` ni en logs): solo se pasa a wrangler.

## Requisitos

- **Dependencias.** `apps/edge/package.json` con `wrangler@4.150.0` y
  `@cloudflare/containers@0.3.7` fijadas exactamente. Comprueba sus APIs en
  los tipos instalados y en `bunx wrangler deploy --help`; los tipos del
  Worker salen de `wrangler types`. `apps/edge` entra en el workspace
  (`apps/*`) y cambia `bun.lock`:
  - añade `COPY apps/edge/package.json apps/edge/package.json` en
    `apps/api/Dockerfile` y en `apps/web/Dockerfile` si copian manifests, y el
    volumen anónimo `/app/apps/edge/node_modules` en los dos servicios de
    `docker-compose.yml`, para que `bun install --frozen-lockfile` siga
    funcionando en Docker;
  - recrea el stack local con `docker compose up --build -d -V` y comprueba
    que health sigue `ok` por `:5173`.
- **Worker.** `/api/*` va a `getContainer(env.API, "main").fetch(request)`:
  con `fetch`, no `containerFetch`, para que pase el WebSocket. El resto va a
  `env.ASSETS.fetch(request)`. Assets: `apps/web/dist` con
  `not_found_handling: "single-page-application"` y
  `run_worker_first: ["/api/*"]`. Dominio:
  `routes: [{ "pattern": "thepower-kanban.josenuevo.dev", "custom_domain": true }]`
  (la zona `josenuevo.dev` está en la misma cuenta).
- **Contenedor.** Binding de Durable Object `API` para `ApiContainer`, con su
  migración (`new_sqlite_classes`), y entrada `containers` con
  `max_instances: 1` e `instance_type: "basic"`. Siempre la instancia
  `"main"`: el hub de la clase 3 vive en memoria y todos los usuarios deben
  llegar a la misma. `defaultPort = 3000` y `sleepAfter` de unas horas. Sus
  `envVars` salen de los secretos del Worker (`BETTER_AUTH_SECRET`,
  `BETTER_AUTH_URL`) más `DATABASE_URL=file:/data/agentic-kanban.db` y
  `API_PORT=3000`.
- **Imagen.** Dockerfile de producción en `apps/edge` con Bun 1.4.3,
  construido con la raíz del monorepo como contexto (comprueba la opción de
  contexto de build en la configuración de wrangler instalada). Copia los
  manifests de todos los paquetes del workspace antes de
  `bun install --frozen-lockfile`. Sin `--hot` ni bind mount: al arrancar
  ejecuta `db:migrate`, `db:seed` y la API. El disco de Containers es
  efímero: cada arranque parte del seed y los cambios se pierden cuando el
  contenedor duerme. Documéntalo; no añadas otra base de datos.
- **Secretos fuera de la imagen.** `.dockerignore` excluye `.env`, `.env.*`,
  `*.local` y `data/` entero (bases y outbox). Ningún secreto en el repo, la
  imagen, los logs ni el frontend.
- **Better Auth.** La URL pública debe contar como origen de confianza.
  Comprueba en `apps/api/src/auth/index.ts` y en el código instalado si
  `baseURL` basta o añade `BETTER_AUTH_URL` a `trustedOrigins`, sin quitar los
  orígenes locales. Las cookies seguras sobre `https` las decide Better Auth.
- **Cuenta.** Antes de desplegar, `bunx wrangler whoami` debe mostrar la
  cuenta del curso; si no, para. Docker tiene que estar en marcha. No uses
  credenciales de otros proyectos.
- **Deploy.** `bun run deploy:cloudflare`. Tras el primer deploy, Cloudflare
  tarda unos minutos en emitir el certificado del dominio y aprovisionar el
  contenedor: reintenta las pruebas con espera (hasta ~5 min) antes de dar un
  fallo por bueno.
- **README.** Arranque local, migración, seed y reset (`docker compose down`,
  borrar `data/*.db*` y `data/outbox.jsonl`) con los comandos reales; la
  preparación de Cloudflare (plan Workers Paid, zona del dominio,
  `wrangler login`, `.env.cloudflare.local`); el deploy y el aviso de disco
  efímero. No ejecutes el reset local: solo documéntalo.
- `AGENTS.md` y `.cursor/rules/` describen `apps/edge` y el deploy: en local,
  Compose con `web` y `api`; en público, Worker y Container. Mantén
  `AGENTS.md` breve.

## Fuera de alcance

Comentarios, menciones, campana, transporte de correo (llega en el 06), otra
base de datos (D1, Turso), CI/CD y borrar recursos de Cloudflare.

## Cómo trabajar

1. **Inspeccionar.** Confirma README, `.gitignore`, `.dockerignore`, scripts
   de `package.json`, `docker-compose.yml`, los Dockerfiles, la configuración
   de Better Auth, los tipos de `@cloudflare/containers`, las opciones de
   wrangler (`containers`, `assets`, `routes`, `--secrets-file`) y
   `bunx wrangler whoami`.
2. **Implementar.** `apps/edge` (Worker, `ApiContainer`, `wrangler.jsonc` y
   Dockerfile de producción), ajustes de Docker local, orígenes de Better
   Auth, script `deploy:cloudflare`, `.dockerignore` y documentación.
3. **Comprobar.** Ejecuta `vp check`, `vp test`, `vp build apps/web`,
   `docker compose config` y health local. Despliega y prueba la URL pública
   con «Probar la URL pública y el canal `wss://`» de
   `prompts/notifications/README.md`. Revisa que no hay secretos en el repo ni
   en la imagen.

## Hecho cuando

- [ ] `vp check`, `vp test` y `vp build apps/web` en verde;
      `docker compose config` es válido y health local sigue `ok` por `:5173`.
- [ ] Deploy hecho en la cuenta comprobada con `wrangler whoami`. En
      `https://thepower-kanban.josenuevo.dev`: `GET /api/health` con `api` y
      `database` en `ok`; Ana inicia sesión (con `Origin` igual a la URL
      pública) y lee su board; Luis `GET /api/projects/proj_ana_notes/board`
      → 404; el WebSocket con `wss://` sigue abierto a los 25 s.
- [ ] Dos navegadores en la URL pública (lo compruebo yo): Ana mueve una
      tarjeta y Luis la ve moverse sin refrescar, con su toast.
