Planifica como implementar una API mínima de lectura para un usuario autenticado. Sin frontend, seed, CORS, RBAC, paquetes nuevos.

Endpoints (GET only):

- GET /api/workspaces → workspaces donde session.user.id está en workspace_member
- GET /api/projects/:projectId → el project si el usuario es miembro del workspace_id de esa fila

Auth (este orden, siempre):

1. Sesión Better Auth con auth.api.getSession({ headers: c.req.raw.headers }). Sin sesión → 401
2. Membership en workspace_member. No miembro o no existe → 404 (nunca 403)
3. El cliente no autoriza: no uses workspaceId del body/query como permiso. En el project, el workspace_id sale de la fila.
4. Toda query tenant-owned filtra por ese workspace_id autorizado.

Datos solo vía @agentic-kanban/db (listWorkspacesForUser, getProjectForMember). La API no importa drizzle-orm ni @libsql/client.
Zod en @agentic-kanban/schemas + @hono/zod-validator en params y responses. Tests parse/reject.
Rutas: un Hono por fichero, app.route("/", …). Health no se toca.

Plan primero: flujo de autorización, endpoints, archivos, cómo verificar.
Luego implementa. Actualiza AGENTS.md y .cursor/rules: membership checks ya existen; CRUD de tablero no.

Verificación: vp check --no-fmt; tests de schema y de authz (401 sin cookie, lista vacía o propia, 404 si no es miembro); GET /api/health sigue OK.
