# Sesión 2 · 02 — El seed del tablero

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

**Cursor: Agent con Grok 4.7 xhigh Fast como único ejecutor.** El profesor
ya ha revisado el plan inicial de Opus y lo adjunta a este paso. Lee
`AGENTS.md`, `prompts/CURSOR.md`, `prompts/kanban/README.md`, ese plan, las
reglas implicadas y el código. No uses Task, subagentes, agentes históricos
ni cambio automático de modelo. No hagas commit ni implementes pasos futuros.

Este prompt autoriza su alcance y sus correcciones locales, aunque la
documentación de partida diga «aún no existe». Ejecuta sin otro «adelante»
ni pausa de aprobación. El plan guía la sesión; verifica sus supuestos contra
el código. Adapta detalles locales conservando contratos y comunica solo los
conflictos importantes que necesiten una decisión. No vuelvas a Opus por rutina.

1. **Inspeccionar.** Confirma estructura del seed actual y consultas de upsert disponibles.
2. **Implementar.** IDs y posiciones cerrados por el prompt. Amplía solo seed y documentación;
   conserva los datos y contratos de la clase 1.
3. **Comprobar.** Ejecuta el seed dos veces dentro de `api`, cuenta filas por project y
   comprueba posiciones contiguas, además de `vp check` y `vp test`.
4. **Revisar y corregir.** Lee tu diff, corrige los problemas confirmados y
   repite los checks afectados. Actualiza la documentación de «Al terminar»
   sin borrar el reparto de modelos. Distingue la evidencia automática y la
   aceptación manual pendiente. CodeRabbit solo por una duda importante;
   el cierre del conjunto se decide en el 08.

## Hecho cuando

- [ ] Tras dos ejecuciones: `proj_agentic_kanban` tiene 3 columnas y 5 tareas;
      `proj_ana_notes`, 3 columnas y 1 tarea; las posiciones van de 0 a n-1
      sin huecos ni repetidos.
- [ ] `vp check` y `vp test` en verde.

## Al terminar

El implementador que cierra el paso actualiza `AGENTS.md` y el README (datos del tablero demo). No hagas commit.
Cierra con el resumen que pide `AGENTS.md`.
