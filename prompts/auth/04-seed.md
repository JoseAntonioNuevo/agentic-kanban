Revisa el estado actual del repo antes de proponer cambios.

Estamos construyendo auth de la Sesión 1.

Implementa un seed determinista e idempotente. Sin endpoints nuevos, UI, CORS, paquetes nuevos. La API no seedea al arrancar.

El tenant es el workspace, no el usuario. Ana y Luis comparten un workspace; Ana tiene otro solo suyo. No colorees la app por nombre de login.

Requisitos:

Datos (y nada más):

- Ana — ana@demo.test
- Luis — luis@demo.test
- contraseña Demo1234!
- workspace "thePower Demo" id fijo `ws_thepower_demo`
- project "Agentic Kanban" id fijo `proj_agentic_kanban`, `workspace_id` de ese workspace
- ambos en `workspace_member` de `ws_thepower_demo`
- workspace "Espacio de Ana" id fijo `ws_ana_demo`
- project "Notas de Ana" id fijo `proj_ana_notes`, `workspace_id` de `ws_ana_demo`
- solo Ana en `workspace_member` de `ws_ana_demo`

Usuarios: `auth.api.signUpEmail` de Better Auth (no INSERT en user/account, no hash propio, no HTTP a `/api/auth`).
Si el email ya existe, reutiliza ese `user.id`.
Workspace/project/member: upsert por id / unique (`workspace_id`, `user_id`). Nunca DELETE masivo.
Script en `apps/api`; datos de tenant solo vía `@agentic-kanban/db`. Comando: `bun run db:seed`
Mismo `.db` que migrate. Nunca Mac API + Compose a la vez. Tras borrar `data/*.db*`: migrate y luego seed.

Plan primero: cómo se crean los usuarios sin saltarse Better Auth, cómo un segundo seed no duplica, archivos concretos.
Luego implementa. Actualiza `AGENTS.md`: seed sí; dashboard no.

Verificación: `vp check --no-fmt`; seed dos veces; 2 users, 2 workspaces, 2 projects, 3 members; Ana en ambos workspaces, Luis solo en `ws_thepower_demo`; login de Ana y Luis por el flujo normal; GET `/api/health` sigue OK.
