Revisa la Sesión 1 como una PR.
Alcance = el alcance es todo lo que hemos implementado que todavía no esta commiteado.
Ejecuta este review después de 06.

Comprueba:

- Sesión: cookie httpOnly, createAuthClient sin baseURL a :3000, 401 sin sesión, getSession por headers
- Zod en @agentic-kanban/schemas; @hono/zod-validator en GET /api/workspaces y /api/projects/:id; no envuelvas /api/auth/*
- Authz: membership en workspace_member; 404 si no es miembro (nunca 403); workspace_id sale de la fila, no del cliente
- IDOR: toda query tenant-owned filtra por workspace_id autorizado. No GET por project id sin membership. El seed incluye el fixture: Luis GET /api/projects/proj_ana_notes → 404 (Ana y Luis siguen compartiendo ws_thepower_demo)
- Seed: signUpEmail, idempotente, IDs fijos, no arranca solo, no DELETE masivo, no HTTP a /api/auth. Shared ws_thepower_demo + Ana-only ws_ana_demo; Luis no es miembro de ws_ana_demo
- Dashboard: lista workspaces con TanStack Query + el mismo Zod schema; no un tema a partir del usuario. Cualquier color/swatch es función de workspace.id. Aula: login Ana → 2 workspaces; login Luis → 1 (el shared)
- API no importa drizzle-orm ni @libsql/client; datos vía @agentic-kanban/db
- Server state: TanStack Query para health y GET /api/workspaces. useSession de Better Auth es la excepción; no lo sustituyas
- Deps: pins exactos. @opentelemetry/api 1.9.0 en la API está permitido. Nada de Next, Redux, React Router, RHF
- AGENTS.md y .cursor/rules coinciden con el árbol

Ejecuta vp check y asegurate que todos los tests pasan correctamente.
