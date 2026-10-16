# Sesión 1 · 01 — Autenticación con Better Auth

Tiempo en clase: ~17 min. Antes de lanzar a los implementadores, presenta un plan de 15 líneas
como máximo (archivos, contratos, reparto entre subagentes y verificación) y
espera mi «adelante».

## Punto de partida

El starter solo tiene el camino de `GET /api/health` de extremo a extremo.
`apps/api/src/auth/index.ts` es un placeholder y el esquema de Drizzle está
vacío. `better-auth` 1.7.10 ya está instalado en la API y en la web. Este
prompt es la «Sesión 1» a la que se refieren `AGENTS.md` y `.cursor/rules/`:
ahora sí toca cablear la autenticación.

## Objetivo

Registro, login, sesión por cookie httpOnly y logout con email y contraseña,
desde el navegador y a través del proxy de Vite+.

## Contratos que fijas aquí

- `auth` en `apps/api/src/auth/index.ts` y rutas en `apps/api/src/routes/auth.ts`.
- Tablas de Better Auth en `packages/db/src/schema/auth.ts`, exportadas desde
  `@agentic-kanban/db`.
- `signUpInputSchema` y `signInInputSchema` en `@agentic-kanban/schemas`.
- `authClient` en `apps/web/src/lib/auth-client.ts`.

## Requisitos

- **Servidor.** `betterAuth` con `drizzleAdapter(getDb(), { provider: "sqlite",
  schema })` sobre `@agentic-kanban/db` (el mismo `.db` que el resto) y
  `emailAndPassword` activado. `BETTER_AUTH_URL` es `http://localhost:5173`
  porque el navegador habla con Vite+, que reenvía `/api` a Hono.
  `trustedOrigins`: `http://localhost:5173` y `http://127.0.0.1:5173`.
- **Rutas.** Delega `GET` y `POST` de `/api/auth/*` en
  `auth.handler(c.req.raw)`. No envuelvas esas rutas con
  `@hono/zod-validator`: Better Auth valida el servidor.
- **Tablas.** `user`, `session`, `account` y `verification` escritas a mano en
  Drizzle con los campos que espera la versión instalada. Compruébalos en
  `node_modules` (por ejemplo con `getAuthTables` de `@better-auth/core/db`)
  en lugar de fiarte de memoria. No uses `@better-auth/cli`, `bunx` ni `npx`:
  descargan paquetes.
- **Rate limit.** En memoria y solo para `POST /api/auth/sign-up/email` y
  `POST /api/auth/sign-in/email`; al superarlo, 429. `get-session` no se limita.
  Vale un middleware de Hono mínimo o el `rateLimit` integrado de Better Auth;
  este último solo se activa por defecto en producción y limita todas las
  rutas, así que habría que activarlo y excluir `get-session`. Detrás del
  proxy de Vite puede no llegar la IP real: comparte un bucket y basta para el
  aula. Los tests no deben chocar con el límite.
- **Validación en el cliente.** `signUpInputSchema` (nombre, email y contraseña
  de 8 a 128 caracteres) y `signInInputSchema`, con tests de parse y de rechazo.
- **Web.** `createAuthClient()` de `better-auth/react` sin `baseURL`: URL
  relativa, mismo origen, sin CORS. Formularios de registro y login con los
  componentes shadcn que ya existen (`card`, `input`, `label`, `button`) y
  estado local de React; sin React Hook Form ni router. Con sesión: nombre del
  usuario, botón de cerrar sesión y la card de health. Nada de
  `dangerouslySetInnerHTML`.
- **Migración.** `bun run db:generate` en el host; el SQL se versiona. Para
  aplicarla, `docker compose exec api bun run db:migrate` si Compose está
  arriba; si no, `bun run db:migrate` en el host. Después de borrar
  `data/*.db*` hay que migrar otra vez. drizzle-kit escribe
  `migrations/meta/*.json` sin el formato de Oxfmt y los regenera en cada
  `db:generate`: excluye `packages/db/migrations/**` de `fmt` en el
  `vite.config.ts` raíz para que `vp check` siga en verde.

## Fuera de alcance

Workspaces, membresías, `workspace_id`, tablero, React Router, paquetes nuevos,
verificación de email y proveedores OAuth.

## Cómo trabajar

Sigue el flujo con subagentes de `AGENTS.md` (Agent workflow). En este paso:

- **Investigar** (Haiku): mapa de `apps/api`, `packages/db`, `packages/schemas` y `apps/web`, y las APIs instaladas que vas a usar (`betterAuth`, `drizzleAdapter`, `createAuthClient`, campos de las tablas con `getAuthTables`). Lanza dos en paralelo: servidor y web.
- **Planificar** (Opus): fija los contratos de arriba y el reparto de ficheros en los briefs.
- **Implementar** (Sonnet): dos en paralelo, con ficheros disjuntos: A, tablas, instancia `auth`, rutas, rate limit y migración generada; B, schemas Zod de los formularios con sus tests, `auth-client` y UI. Después, uno une las dos partes (barrels, montaje en `index.ts`) y actualiza la documentación de «Al terminar».
- **Verificar** (Haiku): aplica la migración, pasa la puerta de calidad y hace las pruebas HTTP de «Hecho cuando» contra `http://localhost:5173`.

## Hecho cuando

- [ ] `vp check` y `vp test` en verde.
- [ ] El SQL de la migración está en `packages/db/migrations/` y se aplicó.
- [ ] HTTP: sign-up de un email nuevo → 200 con cookie; `get-session` con esa
      cookie → el usuario; sign-out → `get-session` ya no devuelve sesión;
      sign-in con contraseña incorrecta → 401.
- [ ] Navegador (lo compruebo yo): registrarme, recargar y seguir dentro,
      cerrar sesión. `GET /api/health` sigue OK.

## Al terminar

El implementador que cierra el paso actualiza `AGENTS.md` (auth por cookie sí; workspaces no) y borra lo que deja
de ser cierto en `.cursor/rules/`: `api.mdc`, `web.mdc`, `db.mdc` y `scope.mdc`
dicen que auth es un placeholder. No hagas commit. Cierra con el resumen que
pide `AGENTS.md`.
