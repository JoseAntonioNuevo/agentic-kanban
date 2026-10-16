# Sesión 2 · 02 — El seed del tablero

Tiempo en clase: ~6 min. Tú no editas código: orquestas. Antes de lanzar a los implementadores, presenta un plan de 8 líneas
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

Tú (Opus) orquestas y no editas ficheros: investigan los subagentes Haiku, implementa Sonnet y verifica Haiku. Usa los subagentes de `.claude/agents/`; si tu herramienta no los tiene, haz los mismos pasos en este orden.

1. **Investigar** — `kanban-recon` (Haiku): estructura del seed actual y consultas de upsert disponibles.
2. **Planificar** — tú: IDs y posiciones de columnas y tareas. Presenta el plan y espera mi «adelante».
3. **Implementar** — `kanban-implementer` (Sonnet): uno solo: seed y documentación de «Al terminar».
4. **Verificar** — `kanban-verifier` (Haiku): ejecuta el seed dos veces y cuenta filas por project.
5. **Revisar** — tú revisas el diff completo. Si algo falla, encarga el arreglo a un `kanban-implementer` y vuelve a verificar.

## Hecho cuando

- [ ] Tras dos ejecuciones: `proj_agentic_kanban` tiene 3 columnas y 5 tareas;
      `proj_ana_notes`, 3 columnas y 1 tarea; las posiciones van de 0 a n-1
      sin huecos ni repetidos.
- [ ] `vp check` y `vp test` en verde.

## Al terminar

El implementador encargado de la documentación actualiza `AGENTS.md` y el README (datos del tablero demo). No hagas commit.
Cierra con el resumen que pide `AGENTS.md`.
