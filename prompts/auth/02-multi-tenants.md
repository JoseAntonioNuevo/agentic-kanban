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

**Cursor: Grok 4.7 Fast directamente como agente principal.** Lee `AGENTS.md`,
`prompts/auth/README.md`, las reglas de DB y el código. No delegues ni lances
Opus, subagentes (`kanban-*` ni integrados de Cursor), revisores o CodeRabbit
por rutina. No hagas commit.

Este prompt es la petición del curso que autoriza las tablas de producto: si
`AGENTS.md` o `.cursor/rules/` dicen «workspaces no» o «sin tablas de
producto», se refieren al estado anterior a este paso; actualízalos al cerrar.

1. Inspecciona las tablas de auth, el modo de timestamp, exports y migraciones.
2. Explica en hasta 8 líneas las tablas, FK, índices y restricción única que
   vas a añadir. Continúa con la implementación sin esperar otro «adelante»:
   los requisitos y el alcance ya están definidos.
3. Implementa tablas, exports y migración; aplícala donde corresponde y
   actualiza la documentación de «Al terminar».
4. Ejecuta `vp check`, `vp test` y las comprobaciones de «Hecho cuando».
   Inspecciona el SQL generado y corrige los fallos del paso. Repite las
   comprobaciones afectadas por cada corrección.

Si aparece una decisión importante que estos requisitos no cubren, expón la
duda para que el profesor decida si usar Opus. No inventes el contrato ni
cambies de modelo en silencio. Explica al cerrar por qué este paso acotado
se ha podido resolver sin orquestador.

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
