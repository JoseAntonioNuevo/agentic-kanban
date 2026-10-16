# Sesión 2 · 02 — El seed del tablero

Tiempo en clase: ~6 min. Antes de editar nada, presenta un plan de 8 líneas
como máximo y espera mi «adelante».

## Punto de partida

El seed de la Sesión 1 crea a Ana, a Luis, `proj_agentic_kanban` (compartido)
y `proj_ana_notes` (solo Ana). Las tablas `column` y `task` existen (prompt 01).

## Objetivo

Un tablero de demostración listo y un segundo tablero para poder probar que no
se puede mover una tarea entre projects.

## Requisitos

- `proj_agentic_kanban`: exactamente `To Do`, `In Progress` y `Done`
  (posiciones 0, 1 y 2) con IDs fijos `col_kanban_todo`, `col_kanban_doing` y
  `col_kanban_done`, y 5 tareas de ejemplo (`task_kanban_1` … `task_kanban_5`)
  repartidas entre las tres, con `position` 0..n-1 dentro de cada columna.
- `proj_ana_notes`: las mismas tres columnas con IDs propios
  (`col_ana_todo`, `col_ana_doing`, `col_ana_done`) y una tarea (`task_ana_1`).
  Ana es miembro de los dos workspaces: así comprobaremos que mover una tarea
  de un project a otro devuelve 404 aunque el usuario tenga acceso a ambos.
- Sigue siendo idempotente: upsert por `id`; ejecutarlo varias veces no
  duplica ni desordena. Nunca DELETE masivo.
- Datos solo vía `@agentic-kanban/db`. Ejecútalo con
  `docker compose exec api bun run db:seed` si Compose está arriba.

## Fuera de alcance

API y frontend.

## Cómo trabajar

Encárgalo a un `kanban-implementer` (Sonnet, de `.claude/agents/`). Después,
`kanban-verifier` (Haiku) ejecuta el seed dos veces y cuenta filas por project.

## Hecho cuando

- [ ] Tras dos ejecuciones: `proj_agentic_kanban` tiene 3 columnas y 5 tareas;
      `proj_ana_notes`, 3 columnas y 1 tarea; las posiciones van de 0 a n-1
      sin huecos ni repetidos.
- [ ] `vp check` y `vp test` en verde.

## Al terminar

Actualiza `AGENTS.md` y el README (datos del tablero demo). No hagas commit.
Cierra con el resumen que pide `AGENTS.md`.
