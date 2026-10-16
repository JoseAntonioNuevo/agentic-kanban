Revisa el estado actual del repo antes de proponer cambios.

Estamos construyendo auth de la Sesión 1.

Implementa autenticación con Better Auth (email + contraseña) sobre el esqueleto actual.

Alcance: registro, login, sesión por cookie, logout.

Requisitos:

- better-auth 1.7.10 (API y web), placeholder en `apps/api/src/auth/`
- drizzleAdapter + provider sqlite sobre `@agentic-kanban/db` (el mismo `.db`)
- Zod en `@agentic-kanban/schemas`: sign-up/sign-in solo en el cliente (password mínimo 8 y con medidas de seguridad apropiadas). Better Auth valida el servidor; no envuelvas `/api/auth/*` con `@hono/zod-validator`
- shadcn (input, button, card) y estado local; sin RHF
- fetch relativo `/api/...` (el proxy de Vite+); no CORS; `createAuthClient` sin `baseURL` a `:3000`. `BETTER_AUTH_URL` es `http://localhost:5173`
- `trustedOrigins`: `http://localhost:5173` y `http://127.0.0.1:5173`
- cookies httpOnly de Better Auth
- rate limit in-memory en Hono solo en POST de sign-up y sign-in (no en get-session)
- no inventar XSS extra: no `dangerouslySetInnerHTML`
- Migraciones: `bun run db:generate` y `db:migrate` una vez; SQL committed. Tras borrar `data/*.db*` hay que `db:migrate` otra vez.

No implementes workspaces, membership, `workspace_id`, tablero, React Router ni paquetes nuevos.

Plan primero: archivos concretos y cómo verificar.
Luego implementa. Actualiza `AGENTS.md`: auth cookie sí; workspaces no.

Verificación: `vp check --no-fmt`; registro, login, sesión por cookie y logout funcionan.
