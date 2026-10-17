# Sesión 2 · 01 — Columnas y tareas

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

Sigue los cinco pasos de `AGENTS.md`. Tú planificas y, al final, corriges. Hasta el «adelante» no se editan ficheros. No hagas commit.

En este paso:

- **Investigar.** `kanban-recon`: schema actual, modo de timestamp, FK existentes y cómo se generan las migraciones.
- **Planificar.** Tú, y espera mi «adelante»: columnas, FK con cascada e índices.
- **Implementar.** `kanban-implementer`: uno solo: tablas, reexport, migración generada y documentación de «Al terminar».
- **Verificar.** `kanban-verifier`: aplica la migración, pasa la puerta de calidad y comprueba health.

## Hecho cuando

- [ ] Hay un SQL nuevo en `packages/db/migrations/` con las dos tablas, sus FK
      e índices, y se aplicó.
- [ ] `vp check` y `vp test` en verde; `GET /api/health` sigue OK.

## Al terminar

El implementador que cierra el paso actualiza `AGENTS.md` (tablas del tablero sí; HTTP no) y
`.cursor/rules/db.mdc`. No hagas commit. Cierra con el resumen que pide
`AGENTS.md`.
