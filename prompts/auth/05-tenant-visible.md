Revisa el estado actual del repo antes de proponer cambios.

Estamos construyendo auth de la Sesión 1.

Haz visible el tenant en el dashboard. Sin tablero, React Router, CORS, RBAC, paquetes nuevos, writes HTTP. No colorees la app por session.user.name / email: el tenant es el workspace.

El seed de 04 ya define shared + privado. Si el .db se creó antes de `ws_ana_demo`, vuelve a `bun run db:seed` (upserts idempotentes). No inventes más filas.

Requisitos:

- useQuery + fetch relativo `/api/workspaces` + `workspaceListResponseSchema.parse` (copia `apps/web/src/hooks/use-health.ts`)
- `credentials: "include"` (la cookie httpOnly debe ir en esta petición; no asumas que authClient la añade a fetch suelto)
- Lista bajo la card de health en `App.tsx`: nombre + swatch opcional
- El acento sale de `workspace.id` (shared vs Ana-only). Ana y Luis ven el mismo color en `ws_thepower_demo`
- Lista vacía es válida (usuario sin memberships)
- Health no se toca
- Docs: `AGENTS.md`, `.cursor/rules/web.mdc`, README (Ana dos espacios, Luis uno). Sin Kanban.

Plan primero: hook, fetch+parse, cómo se pinta el acento, archivos concretos.
Luego implementa. Actualiza `AGENTS.md`: lista de workspaces sí; Kanban no.

Verificación: `vp check --no-fmt`; lista de Ana incluye `ws_thepower_demo` y `ws_ana_demo`; lista de Luis solo `ws_thepower_demo`; Luis GET `/api/projects/proj_ana_notes` → 404; GET `/api/health` sigue OK.
