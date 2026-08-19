Implementa autenticación con Better Auth (email + contraseña) sobre el esqueleto actual.

Alcance: registro, login, sesión por cookie, logout.
Fuera de alcance: workspaces, membership, workspace_id, tablero, React Router, paquetes nuevos, diagrams/.

Usa lo que ya hay:
- better-auth 1.7.1 (API y web), placeholder en apps/api/src/auth/
- drizzleAdapter + provider sqlite sobre @agentic-kanban/db (el mismo .db)
- Zod en @agentic-kanban/schemas: sign-up/sign-in solo en el cliente (password mínimo 8). Better Auth valida el servidor; no envuelvas `/api/auth/*` con `@hono/zod-validator`
- shadcn (input, button, card) y estado local; sin RHF
- fetch relativo `/api/...` (el proxy de Vite+); no CORS; `createAuthClient` sin `baseURL` a `:3000`. `BETTER_AUTH_URL` es `http://localhost:5173`

Seguridad de esta sesión (nada más):
- cookies httpOnly de Better Auth
- rate limit in-memory en Hono solo en POST de sign-up y sign-in (no en get-session)
- no inventar XSS extra: no dangerouslySetInnerHTML

Migraciones: `bun run db:generate` y `db:migrate` una vez; SQL committed. La API no migra al arrancar. Nunca con la API del Mac y Compose a la vez contra el mismo `.db` (Compose parado, o `exec` en el contenedor `api`).

Actualiza `AGENTS.md` y `.cursor/rules`: auth ya no es placeholder. No toques `diagrams/`.

Plan mínimo primero: archivos concretos y cómo verificar.
Verificación: `vp check`; registrar un usuario; login; recargar y ver sesión; logout; `GET /api/health` sigue OK. Si la cookie no sobrevive al reload, revisa `Set-Cookie` vía proxy (origen 5173) antes de inventar CORS.
