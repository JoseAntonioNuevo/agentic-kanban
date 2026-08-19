Revisa la Sesión 1 como una PR.
Alcance = el alcance es todo lo que hemos implementado que todavía no esta commiteado.

Comprueba:

- Sesión: cookie httpOnly, createAuthClient sin baseURL a :3000, 401 sin sesión, getSession por headers
- Zod en @agentic-kanban/schemas; @hono/zod-validator en GET /api/workspaces y /api/projects/:id; no envuelvas /api/auth/*
- Authz: membership en workspace_member; 404 si no es miembro (nunca 403); workspace_id sale de la fila, no del cliente
- IDOR: toda query tenant-owned filtra por workspace_id autorizado. No GET por project id sin membership. El seed no basta (Ana y Luis comparten workspace): un test con un project ajeno debe ser 404 para Luis
- API no importa drizzle-orm ni @libsql/client; datos vía @agentic-kanban/db
- Seed: signUpEmail, idempotente, IDs fijos, no arranca solo, no DELETE masivo, no HTTP a /api/auth
- Server state: TanStack Query para health (y GETs de API si hay cliente). useSession de Better Auth es la excepción; no lo sustituyas
- Deps: pins exactos. @opentelemetry/api 1.9.0 en la API está permitido. Nada de Next, Redux, React Router, RHF
- AGENTS.md y .cursor/rules coinciden con el árbol

Ejecuta vp check y asegurate que todos los tests pasan correctamente.
