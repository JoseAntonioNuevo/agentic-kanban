# Sesión 1 · 01 — Autenticación con Better Auth

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

## Fuera de alcance

Workspaces, membresías, `workspace_id`, tablero, React Router, paquetes nuevos,
verificación de email y proveedores OAuth.

## Cómo trabajar

**Cursor: Opus 5.5 como principal y Grok 4.7 Fast como implementador.** Lee
`AGENTS.md`, `prompts/auth/README.md`, las reglas de las capas implicadas y el
código. Este paso usa el flujo orquestado de la Sesión 1, no el de Sonnet/Haiku:
no invoques los agentes `kanban-*` de `.claude/agents/` ni los subagentes
integrados de Cursor; el único subagente es `s1-grok-implementer`.
No hagas commit ni implementes los pasos siguientes.

1. **Inspección y plan (Opus).** Revisa API, DB, schemas y web. Confirma en
   las versiones instaladas `betterAuth`, `drizzleAdapter`, campos de tablas
   con `getAuthTables` y `createAuthClient`. Presenta un plan de hasta 15
   líneas con archivos, contratos, integración, migración y comprobaciones.
   Explica por qué aquí compensa orquestar: auth cruza varias capas. Espera
   mi «adelante» antes de editar.
2. **Implementación (Grok).** Delega explícitamente en `s1-grok-implementer`.
   El brief incluye tablas, instancia `auth`, rutas y montaje, rate limit,
   schemas con tests, cliente, formularios, migración y documentación.
   Un implementador por defecto; divide solo con independencia real,
   contratos acordados y archivos disjuntos. Asigna también los barrels.
3. **Comprobaciones (Grok).** Aplica la migración en el entorno correcto,
   ejecuta `vp check`, `vp test` y las pruebas HTTP de «Hecho cuando» por
   `http://localhost:5173`. Usa cookie jar temporal y `Origin` de confianza
   en los POST de auth. Reporta el resultado real sin mostrar secretos.
4. **Revisión (Opus).** Lee el diff y la evidencia de sesión, cookies, proxy
   e integración. Encarga a Grok las correcciones necesarias; no edites tú
   la app. Repite solo las comprobaciones invalidadas por esas correcciones.
   No lances CodeRabbit de rutina: solo si queda una duda relevante que
   justifique revisión adicional, dejando constancia del alcance cubierto.

## Requisitos

- **Servidor.** `betterAuth` con `drizzleAdapter(db, { provider: "sqlite",
  schema })` sobre `@agentic-kanban/db` (el mismo `.db` que el resto) y
  `emailAndPassword` activado. Usa el proxy lazy `db`, no `getDb()` en el
  nivel de módulo: `db.mdc` prohíbe abrir la base al importar. Comprueba que
  el adaptador instalado funciona con ese proxy. El cliente de Drizzle se crea
  sin `schema`, así que `db.query` está vacío: pasa el `schema` al adaptador
  y usa el query builder. `BETTER_AUTH_URL` es `http://localhost:5173`
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
  `POST /api/auth/sign-in/email`: **10 peticiones por minuto y por ruta**; al
  superarlo, 429. `get-session` no se limita. Vale un middleware de Hono
  mínimo o el `rateLimit` integrado de Better Auth. El integrado solo se
  activa por defecto en producción, limita todas las rutas y trae una regla
  propia de 3 cada 10 s para sign-in/sign-up: habría que activarlo, fijar
  esas dos reglas y excluir `get-session`. Detrás del proxy de Vite puede no
  llegar la IP real: comparte un bucket y basta para el aula. Deja el límite
  configurable para que los tests de API del 03 (que registran usuarios por
  `/api/auth`) no choquen con él, sin cambiar el comportamiento en desarrollo.
- **Validación en el cliente.** `signUpInputSchema` (nombre, email y contraseña
  de 8 a 128 caracteres) y `signInInputSchema`, con tests de parse y de rechazo.
- **Web.** `createAuthClient()` de `better-auth/react` sin `baseURL`: URL
  relativa, mismo origen, sin CORS. Formularios de registro y login con los
  componentes shadcn que ya existen (`card`, `input`, `label`, `button`) y
  estado local de React; sin React Hook Form ni router. La sesión se lee con
  `authClient.useSession()`: es la única excepción a TanStack Query para
  estado de servidor; no la envuelvas en `useQuery`. Con sesión: nombre del
  usuario, botón de cerrar sesión y la card de health. Nada de
  `dangerouslySetInnerHTML`.
- **Migración.** `bun run db:generate` en el host; el SQL se versiona. Para
  aplicarla, `docker compose exec api bun run db:migrate` si Compose está
  arriba; si no, `bun run db:migrate` en el host. Después de borrar
  `data/*.db*` hay que migrar otra vez. drizzle-kit genera los JSON de
  `packages/db/migrations/meta/` sin el formato de Oxfmt: si `vp check` falla
  por ellos, excluye `packages/db/migrations/**` con `fmt.ignorePatterns` en
  el `vite.config.ts` raíz. No reformatees ni edites a mano lo generado.

## Hecho cuando

- [ ] `vp check` y `vp test` en verde.
- [ ] El SQL de la migración está en `packages/db/migrations/` y se aplicó.
- [ ] HTTP: sign-up de un email nuevo → 200 con cookie; `get-session` con esa
      cookie → el usuario; sign-out → `get-session` ya no devuelve sesión;
      sign-in con contraseña incorrecta → 401.
- [ ] Rate limit, **como última prueba HTTP** (bloquea la ruta hasta un
      minuto): sign-in repetidos con contraseña incorrecta → 401 hasta el
      límite y después 429; `get-session` sigue respondiendo sin 429.
- [ ] Navegador (lo compruebo yo): registrarme, recargar y seguir dentro,
      cerrar sesión. `GET /api/health` sigue OK.

## Al terminar

Grok actualiza `AGENTS.md` (auth por cookie sí;
workspaces no) y quita de `.cursor/rules/` lo que ya no es cierto: `api.mdc`,
`web.mdc`, `db.mdc` y `scope.mdc` dicen que auth es un placeholder. No hagas
commit. Cierra con el resumen que pide `AGENTS.md`.
