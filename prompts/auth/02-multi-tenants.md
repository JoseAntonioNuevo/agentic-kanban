# Sesión 1 · 02 — El modelo multi-tenant

Tiempo en clase: ~12 min. Antes de lanzar a los implementadores, presenta un plan de 12 líneas
como máximo y espera mi «adelante».

## Punto de partida

La autenticación con Better Auth funciona (prompt 01). Las tablas `user`,
`session`, `account` y `verification` están en
`packages/db/src/schema/auth.ts`.

## Objetivo

Las tablas que convierten el workspace en el tenant: `workspace`,
`workspace_member` y `project`, con una migración nueva.

## Requisitos

Drizzle con `sqliteTable`, `text` e `integer` de `drizzle-orm/sqlite-core`, en
`packages/db/src/schema/` (un fichero por agregado, reexportado desde
`schema/index.ts`):

- `workspace`: `id` (text, PK), `name`, `created_at`.
- `workspace_member`: `workspace_id` (FK → `workspace.id`), `user_id` (FK →
  `user.id` de Better Auth), `created_at` y `UNIQUE (workspace_id, user_id)`.
  Sin `role`: RBAC queda fuera del curso.
- `project`: `id` (text, PK), `workspace_id` NOT NULL (FK → `workspace.id`),
  `name`, `created_at`.
- Índices en `project.workspace_id` y en `workspace_member.user_id`.
- `created_at` con el mismo modo de timestamp que las tablas de auth, para
  serializarlo después con `toISOString()`.
- Claves foráneas con `onDelete: "cascade"`: libSQL aplica las FK, y así un
  borrado nunca deja filas huérfanas ni falla a medias.
- Una sola migración nueva con `bun run db:generate`; no edites las anteriores.
  Aplícala con `docker compose exec api bun run db:migrate` si Compose está
  arriba (si no, en el host). La API nunca migra al arrancar.

## Fuera de alcance

Endpoints, UI, seed, schemas Zod de API, `slug`, `owner`, columnas y tareas.

## Cómo trabajar

Sigue el flujo con subagentes de `AGENTS.md` (Agent workflow). En este paso:

- **Investigar** (Haiku): tablas de auth existentes, su modo de timestamp, cómo se exporta el schema y cómo se generan las migraciones.
- **Planificar** (Opus): tablas, FK, índices y restricción única.
- **Implementar** (Sonnet): uno solo: tablas, reexport, migración generada y documentación de «Al terminar».
- **Verificar** (Haiku): aplica la migración, pasa la puerta de calidad y comprueba health.

## Hecho cuando

- [ ] `vp check` y `vp test` en verde.
- [ ] Hay un SQL nuevo en `packages/db/migrations/` con las tres tablas, la
      restricción única, las FK y los índices.
- [ ] La migración se aplicó y `GET http://localhost:5173/api/health` sigue OK.

## Al terminar

El implementador que cierra el paso actualiza `AGENTS.md` (tablas sí; endpoints no) y `.cursor/rules/db.mdc`.
No hagas commit. Cierra con el resumen que pide `AGENTS.md`.
