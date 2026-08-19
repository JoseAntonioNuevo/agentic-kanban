Planifica como implementar un Seed determinista e idempotente. Sin endpoints nuevos, UI, CORS, paquetes nuevos. La API no seedea al arrancar.

Datos (y nada más):

- Ana — ana@demo.test
- Luis — luis@demo.test
- contraseña Demo1234!
- workspace "thePower Demo" id fijo ws_thepower_demo
- project "Agentic Kanban" id fijo proj_agentic_kanban, workspace_id de ese workspace
- ambos en workspace_member

Usuarios: auth.api.signUpEmail de Better Auth (no INSERT en user/account, no hash propio, no HTTP a /api/auth).
Si el email ya existe, reutiliza ese user.id.
Workspace/project/member: upsert por id / unique (workspace_id, user_id). Nunca DELETE masivo.
Script en apps/api; datos de tenant solo vía @agentic-kanban/db. Comando: bun run db:seed
Mismo .db que migrate. Nunca Mac API + Compose a la vez. Tras borrar `data/*.db*`: migrate y luego seed.

Plan primero: cómo se crean los usuarios sin saltarse Better Auth, cómo un segundo seed no duplica, archivos concretos.
Luego implementa. Actualiza AGENTS.md, rules y README (cómo seedea el aula).

Verificación: vp check --no-fmt; seed dos veces; 2 users, 1 workspace, 1 project, 2 members; login de Ana y Luis por el flujo normal; GET /api/health sigue OK.
