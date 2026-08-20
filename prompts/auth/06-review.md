Lee `AGENTS.md` y revisa toda la implementación actual de la Sesión 1 como si estuvieras haciendo una revisión de PR.

No añadas funcionalidades nuevas.

Busca específicamente:

Sesión: cookie httpOnly, createAuthClient sin baseURL a :3000, 401 sin sesión, getSession por headers
Zod en `@agentic-kanban/schemas`; `@hono/zod-validator` en GET `/api/workspaces` y `/api/projects/:id`; no envuelvas `/api/auth/*`
Authz: membership en `workspace_member`; 404 si no es miembro (nunca 403); `workspace_id` sale de la fila, no del cliente
IDOR: toda query tenant-owned filtra por `workspace_id` autorizado. No GET por project id sin membership. Luis GET `/api/projects/proj_ana_notes` → 404 (Ana y Luis siguen compartiendo `ws_thepower_demo`)
Seed: `signUpEmail`, idempotente, IDs fijos, no arranca solo, no DELETE masivo, no HTTP a `/api/auth`. Shared `ws_thepower_demo` + Ana-only `ws_ana_demo`; Luis no es miembro de `ws_ana_demo`
Dashboard: lista workspaces con TanStack Query + el mismo Zod schema; no un tema a partir del usuario. Cualquier color/swatch es función de `workspace.id`. Aula: login Ana → 2 workspaces; login Luis → 1 (el shared)
API no importa drizzle-orm ni `@libsql/client`; datos vía `@agentic-kanban/db`
Server state: TanStack Query para health y GET `/api/workspaces`. `useSession` de Better Auth es la excepción; no lo sustituyas
Deps: pins exactos. Nada de Next, Redux, React Router, RHF
`AGENTS.md` y `.cursor/rules` coinciden con el árbol
incumplimientos de `AGENTS.md`

Si se detectan problemas, dame únicamente los reales, su severidad y el plan mínimo. No modifiques código hasta que aprobemos el plan.
