# Sesión 2 · 01 — Columnas y tareas

Tiempo en clase: ~6 min. Tú no editas código: orquestas. Antes de lanzar a los implementadores, presenta un plan de 10 líneas
como máximo y espera mi «adelante».

## Punto de partida

La Sesión 1 está completa: auth con Better Auth, `workspace`,
`workspace_member` y `project`, lecturas autorizadas, seed de Ana y Luis y
dashboard. Todavía no hay columnas ni tareas.

## Objetivo

El modelo de datos del tablero, con un orden que persiste.

## Requisitos

- `column`: `id` (text, PK), `workspace_id`, `project_id`, `name`, `position`,
  `created_at`.
- `task`: `id` (text, PK), `workspace_id`, `project_id`, `column_id`, `title`,
  `description` (texto, `""` por defecto), `position`, `created_at`.
- Claves foráneas hacia `workspace`, `project` y `column` con
  `onDelete: "cascade"`: libSQL aplica las FK y, sin cascada, borrar una
  columna o un project fallaría.
- `position` es un entero ≥ 0 **sin** `UNIQUE`: al reordenar dentro de una
  transacción, la unicidad se rompería a mitad de camino. Usa índices no
  únicos: `(project_id, position)` en `column`, `(column_id, position)` en
  `task`, y `workspace_id` en ambas.
- Cada fila guarda su `workspace_id` para filtrar por tenant sin depender de
  lo que mande el cliente; la API se encargará de que coincida con el del
  project.
- Mismo modo de timestamp que el resto de tablas. Una migración nueva; no
  edites las anteriores. Aplícala con
  `docker compose exec api bun run db:migrate` si Compose está arriba.

## Fuera de alcance

API, frontend, seed, responsables, etiquetas y fechas límite.

## Cómo trabajar

Tú (Opus) orquestas y no editas ficheros: investigan los subagentes Haiku, implementa Sonnet y verifica Haiku. Usa los subagentes de `.claude/agents/`; si tu herramienta no los tiene, haz los mismos pasos en este orden.

1. **Investigar** — `kanban-recon` (Haiku): schema actual, modo de timestamp, FK existentes y cómo se generan las migraciones.
2. **Planificar** — tú: columnas, FK con cascada e índices. Presenta el plan y espera mi «adelante».
3. **Implementar** — `kanban-implementer` (Sonnet): uno solo: tablas, reexport, migración generada y documentación de «Al terminar».
4. **Verificar** — `kanban-verifier` (Haiku): aplica la migración, pasa la puerta de calidad y comprueba health.
5. **Revisar** — tú revisas el diff completo. Si algo falla, encarga el arreglo a un `kanban-implementer` y vuelve a verificar.

## Hecho cuando

- [ ] Hay un SQL nuevo en `packages/db/migrations/` con las dos tablas, sus FK
      e índices, y se aplicó.
- [ ] `vp check` y `vp test` en verde; `GET /api/health` sigue OK.

## Al terminar

El implementador encargado de la documentación actualiza `AGENTS.md` (tablas del tablero sí; HTTP no) y
`.cursor/rules/db.mdc`. No hagas commit. Cierra con el resumen que pide
`AGENTS.md`.
