# Sesión 1 · 03 — Las lecturas autorizadas

## Punto de partida

Auth (01) y tablas `workspace`, `workspace_member` y `project` (02). Todavía no
hay endpoints de producto ni tests de API con base de datos.

## Objetivo

Dos `GET` autenticados que solo devuelven lo que permite la membresía, y el
arnés de tests de API que usarán todas las sesiones siguientes.

## Contratos que fijas aquí

- `GET /api/workspaces` → los workspaces de los que el usuario es miembro.
  Cada uno incluye `projects: [{ id, name }]` de ese workspace: la Sesión 2
  abrirá el tablero desde esa lista. Una lista vacía es válida.
- `GET /api/projects/:projectId` → el project, si el usuario es miembro de su
  workspace.
- Schemas en `@agentic-kanban/schemas`: `workspaceSchema`,
  `workspaceListResponseSchema`, `projectSchema` y `projectIdParamSchema`.
  Las fechas viajan como string ISO (`z.iso.datetime()`).
- `requireSession` en `apps/api/src/middleware/session.ts`: deja `userId` en el
  contexto o responde 401 con `{ error }`.
- Consultas en `@agentic-kanban/db`: `listWorkspacesForUser(userId)` y
  `getProjectForMember(projectId, userId)`, más las escrituras idempotentes
  `upsertWorkspace`, `addWorkspaceMember` y `upsertProject` (las usan los
  fixtures de test aquí y el seed en el 04).
- `migrateDatabase()` en `@agentic-kanban/db`: aplica las migraciones de
  `packages/db/migrations/` con el migrador instalado de Drizzle. Solo lo usa
  el arnés de tests; la API nunca migra al arrancar.
- Un `Hono` por fichero (`apps/api/src/routes/workspaces.ts` y `projects.ts`)
  montado con `app.route("/", …)`. `apps/api/src/index.ts` exporta `app` para
  los tests.

## Fuera de alcance

Frontend, seed, escrituras, CORS, RBAC y paquetes nuevos. Health no se toca.

## Cómo trabajar

**Cursor: Opus 5.5 como principal y Grok 4.7 Fast como implementador.** Lee
`AGENTS.md`, `prompts/auth/README.md`, las reglas implicadas y el código.
No invoques los agentes `kanban-*` de `.claude/agents/` ni los subagentes
integrados de Cursor; el único subagente es `s1-grok-implementer`. Este
prompt autoriza los primeros endpoints de producto aunque la documentación
diga «endpoints no»: se actualiza al cerrar. No hagas commit ni añadas
frontend o seed.

1. **Inspección y contratos (Opus).** Revisa auth, rutas, DB, schemas y la
   configuración de tests de Vite+. Confirma en `node_modules` las firmas de
   `auth.api.getSession` y del migrador de Drizzle. Presenta un plan de hasta
   15 líneas: schemas y formas de respuesta, consultas, middleware, archivos,
   integración y pruebas. Explica por qué la autorización merece este plan.
   Espera mi «adelante» antes de editar.
2. **Implementación (Grok).** Delega explícitamente en `s1-grok-implementer`
   (omite el parámetro `model` en `Task` —nunca `inherit`— para que se aplique
   el frontmatter de Grok) con los contratos anteriores y todos los archivos
   necesarios: schemas, consultas de DB, middleware, rutas, montaje, arnés,
   tests y documentación. Un implementador por defecto. Si divides, primero
   fija contratos y evita que dos agentes editen el mismo archivo; no
   paralelices por obligación.
3. **Comprobaciones (Grok).** Ejecuta `vp check`, `vp test` y las pruebas de
   aceptación. Los casos con membresías usan fixtures en la base de test;
   no adelantes el seed de la demo ni escribas datos de test en `data/`.
   Las pruebas HTTP del proceso levantado pasan por el proxy de Vite+.
4. **Revisión (Opus).** Sigue las rutas hasta las consultas y comprueba
   sesión, membresía y filtro de tenant, además de la evidencia de tests.
   Encarga las correcciones a Grok y repite los checks afectados. Si queda
   una incertidumbre concreta de aislamiento, justifica CodeRabbit antes de
   construir encima; no lo ejecutes por rutina ni repitas una revisión aún
   válida. Conserva el alcance exacto que haya revisado.

## Autorización (siempre en este orden)

1. Sesión con `auth.api.getSession({ headers: c.req.raw.headers })`. Sin
   sesión → 401.
2. Membresía en `workspace_member`. Si no es miembro o el recurso no existe →
   404, nunca 403: así no revelamos que el recurso existe.
3. El `workspace_id` sale de la fila de la base de datos, nunca de un
   `workspaceId` del body, la query o los params.
4. Toda consulta tenant-owned filtra por ese `workspace_id` autorizado.

Validación: `@hono/zod-validator` en los params; las respuestas se construyen y
pasan por `.parse()` del schema compartido antes de `c.json`, igual que health.
La API no importa `drizzle-orm` ni `@libsql/client`, tampoco en los tests.
El cliente de Drizzle no tiene `schema`, así que `db.query` está vacío: las
consultas usan el query builder.

## Arnés de tests

- Los tests de API nunca usan `data/agentic-kanban.db`: usan su propia base
  temporal con las migraciones aplicadas (`migrateDatabase()`) antes de
  empezar, `NODE_ENV=test` y un `BETTER_AUTH_SECRET` de test. Configúralo en
  la config de Vite+ que ya existe (`test.env` y `test.setupFiles`), sin crear
  otra config de Vitest.
- Vitest ejecuta los ficheros en paralelo: cada fichero de test tiene su
  propia base (por ejemplo, un fichero temporal único por fichero, borrado al
  terminar). `DATABASE_URL` se fija en el setup **antes** de importar la API o
  `@agentic-kanban/db`, porque el cliente se cachea en la primera consulta.
- `vp test` corre sobre Node, no sobre Bun: el código que importan los tests
  no usa APIs `Bun.*` ni `bun:*`.
- Los helpers registran usuarios por `/api/auth/sign-up/email`: fija un
  `AUTH_RATE_LIMIT_MAX` alto en `test.env` para que el rate limit del 01 no
  haga fallar la suite, sin cambiar el comportamiento en desarrollo ni
  debilitar otros tests.
- Helpers compartidos en `apps/api/src/test/`: registrar un usuario y obtener
  su cookie, crear fixtures de workspace, membresía y project (mediante
  `upsertWorkspace`, `addWorkspaceMember` y `upsertProject` de
  `@agentic-kanban/db`), y hacer peticiones con cookie contra `app`. Las
  peticiones a `/api/auth/*` llevan `Origin: http://localhost:5173`: Better
  Auth rechaza las que llevan cookie y no traen un origen de confianza.
- Tests: schemas (parse y rechazo) y autorización: 401 sin cookie, lista vacía
  para un usuario sin membresías, lista propia con sus projects, 200 para un
  project propio y 404 para uno de otro workspace.

## Hecho cuando

- [ ] `vp check` y `vp test` en verde, y los tests usan su propia base
      (enséñame dónde se configura).
- [ ] HTTP: `GET /api/workspaces` sin cookie → 401; con un usuario recién
      registrado → 200 y `[]`.
- [ ] Con fixtures en la base aislada, un miembro obtiene su lista con
      projects y `GET /api/projects/:projectId` propio → 200; otro usuario
      sin membresía obtiene 404 para ese mismo project. Muestra los casos y
      sus resultados; no basta con una lista vacía ni con inspeccionar código.
- [ ] `GET /api/health` sigue OK.

## Al terminar

Grok actualiza `AGENTS.md` (contratos de
lectura y cómo correr los tests de API), `.cursor/rules/api.mdc` y
`.cursor/rules/scope.mdc`. No hagas commit. Cierra con el resumen que pide
`AGENTS.md`.
