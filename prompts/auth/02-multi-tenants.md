# Sesión 1 · 02 — El modelo multi-tenant

## Punto de partida

La autenticación con Better Auth funciona (prompt 01). Las tablas `user`,
`session`, `account` y `verification` están en
`packages/db/src/schema/auth.ts`.

## Objetivo

Las tablas que convierten el workspace en el tenant: `workspace`,
`workspace_member` y `project`, con una migración nueva.

## Fuera de alcance

Endpoints, UI, seed, schemas Zod de API, `slug`, `owner`, columnas y tareas.

## Cómo trabajar

**Cursor: Agent con Opus 5.5 orquestando de forma autónoma; Grok 4.7 xhigh
Fast ejecuta.** Lee `AGENTS.md`, `prompts/CURSOR.md`, `prompts/auth/README.md`,
las reglas implicadas y el código. Usa `kanban-grok-worker` con
`model: "grok-4.7-xhigh-fast"` explícito en cada nueva Task si está en el catálogo;
si cambia, aplica el protocolo de la guía común. No omitas `model`, no uses
`inherit`, Claude, agentes históricos ni subagentes integrados.

Este prompt autoriza su alcance y sus correcciones locales aunque el estado
anterior diga «aún no existe». Opus coordina, fija contratos y revisa; Grok
inspecciona, implementa, prueba y actualiza la documentación al cerrar. No
pidas «adelante», no hagas commit ni implementes los pasos siguientes.

1. **Inspección (Grok).** Confirma tablas de auth, timestamps, exports y migraciones.
2. **Contratos (Opus).** Fija tablas, FK, índices y unicidad de membresía en un
   plan breve y continúa. Un solo worker suele bastar: no hay que inventar
   paralelismo para este paso cerrado.
3. **Implementación (Grok).** Tablas, exports, migración y documentación de
   «Al terminar». Genera en host y aplica dentro de `api` con Compose arriba.
4. **Comprobaciones y revisión.** Grok inspecciona el SQL generado, ejecuta
   `vp check`, `vp test` y «Hecho cuando». Opus revisa FK, unicidad y evidencia;
   Grok corrige y repite los checks afectados, sin otra aprobación.

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

## Hecho cuando

- [ ] `vp check` y `vp test` en verde.
- [ ] Hay un SQL nuevo en `packages/db/migrations/` con las tres tablas, la
      restricción única, las FK y los índices.
- [ ] La migración se aplicó y `GET http://localhost:5173/api/health` sigue OK.

## Al terminar

Actualiza `AGENTS.md` (tablas sí;
endpoints no), `.cursor/rules/db.mdc` y `.cursor/rules/scope.mdc`. No hagas
commit. Cierra con el resumen que pide `AGENTS.md`.
