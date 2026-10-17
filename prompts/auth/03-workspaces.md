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

Sigue los cinco pasos de `AGENTS.md`. Tú planificas y, al final, corriges.
Hasta el «adelante» no se editan ficheros. Durante la implementación solo
escriben los `kanban-implementer`. No hagas commit.

1. **Investigar.** Un `kanban-recon`: `auth`, rutas existentes, `packages/db`,
   `packages/schemas` y cómo se ejecutan los tests con la config de Vite+.
   Confirma en `node_modules` las firmas de `auth.api.getSession` y del
   migrador de Drizzle.
2. **Planificar.** Tú. Como máximo 15 líneas. En los briefs quedan fijados
   los schemas, las firmas de las consultas y la del middleware. Para y
   espera mi «adelante».
3. **Implementar.** Primero un `kanban-implementer` escribe los schemas
   compartidos y las firmas de las consultas. Después, dos en paralelo, con
   ficheros disjuntos:
   - A: consultas en `packages/db`, `requireSession`, rutas y montaje.
   - B: arnés de tests y tests contra los contratos.
   Uno de ellos actualiza la documentación de «Al terminar». Dos subagentes
   nunca editan el mismo fichero.
4. **Verificar.** Un `kanban-verifier`: puerta de calidad y pruebas HTTP de
   «Hecho cuando» por el proxy.
5. **Revisar.** Tú buscas cualquier consulta sin filtro de tenant, corriges
   y pules, y vuelves a lanzar `kanban-verifier`.

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
- [ ] `GET /api/health` sigue OK.

## Al terminar

El implementador que cierra el paso actualiza `AGENTS.md` (contratos de
lectura y cómo correr los tests de API) y `.cursor/rules/api.mdc`. No hagas
commit. Cierra con el resumen que pide `AGENTS.md`.
