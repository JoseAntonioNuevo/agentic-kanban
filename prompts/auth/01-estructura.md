Implementa autenticación con Better Auth (email + contraseña) sobre el esqueleto actual.

Alcance: registro, login, sesión por cookie, logout.
Fuera de alcance: workspaces, membership, workspace_id, tablero, React Router, paquetes nuevos.

Usa lo que ya hay:

- better-auth 1.7.1 (API y web), placeholder en apps/api/src/auth/
- drizzleAdapter + provider sqlite sobre @agentic-kanban/db (el mismo .db)
- Zod en @agentic-kanban/schemas: sign-up/sign-in solo en el cliente (password mínimo 8 y con medidas de seguridad apropiadas). Better Auth valida el servidor; no envuelvas `/api/auth/*` con `@hono/zod-validator`
- shadcn (input, button, card) y estado local; sin RHF
- fetch relativo `/api/...` (el proxy de Vite+); no CORS; `createAuthClient` sin `baseURL` a `:3000`. `BETTER_AUTH_URL` es `http://localhost:5173`
- `trustedOrigins`: `http://localhost:5173` y `http://127.0.0.1:5173`

Seguridad de esta sesión (nada más):

- cookies httpOnly de Better Auth
- rate limit in-memory en Hono solo en POST de sign-up y sign-in (no en get-session)
- no inventar XSS extra: no dangerouslySetInnerHTML

Migraciones: `bun run db:generate` y `db:migrate` una vez; SQL committed.
Tras borrar `data/*.db*` hay que `db:migrate` otra vez.

Actualiza `AGENTS.md`, `.cursor/rules` y `README.md` en consecuencia al terminar la implementación.

Plan mínimo primero: archivos concretos y cómo verificar.
Verificación: `vp check --no-fmt` al terminar y asegurate que todos los tests previos y nuevos pasan correctamente y no has introducido regresiones.
