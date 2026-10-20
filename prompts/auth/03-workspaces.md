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
  `getProjectForMember(projectId, userId)`.
- Un `Hono` por fichero (`apps/api/src/routes/workspaces.ts` y `projects.ts`)
  montado con `app.route("/", …)`. `apps/api/src/index.ts` exporta `app` para
  los tests.

## Fuera de alcance

Frontend, seed, escrituras, CORS, RBAC y paquetes nuevos. Health no se toca.

## Cómo trabajar

**Cursor: Opus 5.5 como principal y Grok 4.7 Fast como implementador.** Lee
`AGENTS.md`, `prompts/auth/README.md`, las reglas implicadas y el código.
No hagas commit ni añadas frontend o seed.

1. **Inspección y contratos (Opus).** Revisa auth, rutas, DB, schemas y la
   configuración de tests de Vite+. Confirma en `node_modules` las firmas de
   `auth.api.getSession` y del migrador de Drizzle. Presenta un plan de hasta
   15 líneas: schemas y formas de respuesta, consultas, middleware, archivos,
   integración y pruebas. Explica por qué la autorización merece este plan.
   Espera mi «adelante» antes de editar.
2. **Implementación (Grok).** Delega explícitamente en `s1-grok-implementer`
   con los contratos anteriores y todos los archivos necesarios: schemas,
   consultas de DB, middleware, rutas, montaje, arnés, tests y documentación.
   Un implementador por defecto. Si divides, primero fija contratos y evita
   que dos agentes editen el mismo archivo; no paralelices por obligación.
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
La API no importa `drizzle-orm` ni `@libsql/client`.

## Arnés de tests

- Los tests de API nunca usan `data/agentic-kanban.db`: usan su propia base
  (fichero temporal o en memoria) con las migraciones aplicadas antes de
  empezar y un `BETTER_AUTH_SECRET` de test. Configúralo en la config de Vite+
  que ya existe, sin crear otra config de Vitest.
- Helpers compartidos en `apps/api/src/test/`: registrar un usuario y obtener
  su cookie, crear fixtures de workspace, membresía y project, y hacer
  peticiones con cookie contra `app`. Las peticiones a `/api/auth/*` llevan
  `Origin: http://localhost:5173`: Better Auth rechaza las que llevan cookie y
  no traen un origen de confianza.
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
lectura y cómo correr los tests de API) y `.cursor/rules/api.mdc`. No hagas
commit. Cierra con el resumen que pide `AGENTS.md`.
