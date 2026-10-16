# Sesión 3 · 04 — El cliente parchea la caché

Tiempo en clase: ~15 min. Tú no editas código: orquestas. Antes de lanzar a los implementadores, presenta un plan de 12 líneas
como máximo (hook, cuándo se abre y se cierra, cómo se parchea la query,
ficheros) y espera mi «adelante».

## Punto de partida

El servidor publica `task.created`, `task.updated`, `task.deleted` y
`task.moved` por `GET /api/projects/:projectId/events` (02 y 03). El tablero se
pinta con `useBoard` y `boardQueryKey`, y las mutations llevan una
`mutationKey` que empieza por `["board", projectId]` (Sesión 2).

## Objetivo

Que Luis vea los cambios de Ana sin refrescar, sin romper la actualización
optimista de Ana.

## Contratos que fijas aquí

- `applyBoardEvent(board, event)`: función pura junto a `applyBoardMove` en
  `packages/schemas/src/board.ts`. Es idempotente: `task.created` inserta si
  el id no está; `task.updated` reemplaza por id; `task.deleted` elimina si
  está y renumera; `task.moved` reutiliza `applyBoardMove`.
- `useBoardEvents(projectId, userId)` en
  `apps/web/src/hooks/use-board-events.ts`, montado por `BoardScreen`. La
  Sesión 4 lo ampliará en lugar de abrir otra conexión.

## Requisitos

- Un solo `EventSource` por tablero, a la URL relativa
  `/api/projects/${projectId}/events`. Es mismo origen, así que la cookie
  viaja sola; nunca apuntes a `:3000`.
- `onmessage`: `JSON.parse` y `boardEventSchema.safeParse`. Ignora lo que no
  parsea.
- Aplica el evento con
  `setQueryData(boardQueryKey(...), (b) => b && applyBoardEvent(b, event))`.
- Eventos propios (`actorUserId` igual al usuario): si en esta pestaña hay una
  mutation del tablero en curso
  (`queryClient.isMutating({ mutationKey: ["board", projectId] }) > 0`),
  ignóralos, porque su `onSettled` ya reconcilia. Si no, aplícalos: son
  idempotentes y mantienen sincronizada otra pestaña del mismo usuario.
- Al reconectar (`onopen` después de un error), invalida la query del board:
  el hub vive en memoria y no repite lo que se perdió durante el corte.
- Cierra el `EventSource` al desmontar o al cambiar de project.
- TanStack Query sigue siendo la única fuente del estado del servidor: no
  copies el board a `useState`. Sin toasts todavía y sin librerías nuevas de
  realtime.
- Tests de `applyBoardEvent`: cada tipo de evento, idempotencia (aplicarlo dos
  veces da lo mismo que una) y evento de una tarea que no está en el board.

## Fuera de alcance

Toasts, presencia, comentarios y Socket.IO.

## Cómo trabajar

Tú (Opus) orquestas y no editas ficheros: investigan los subagentes Haiku, implementa Sonnet y verifica Haiku. Usa los subagentes de `.claude/agents/`; si tu herramienta no los tiene, haz los mismos pasos en este orden.

1. **Investigar** — `kanban-recon` (Haiku): `use-board`, `boardQueryKey`, la `mutationKey` de las mutations, `BoardScreen` y `applyBoardMove`.
2. **Planificar** — tú: firma del hook y reglas del eco propio. Presenta el plan y espera mi «adelante».
3. **Implementar** — `kanban-implementer` (Sonnet): dos en paralelo: A, `applyBoardEvent` y sus tests; B, `useBoardEvents` y su montaje en `BoardScreen` con la firma fijada. Uno de ellos actualiza la documentación de «Al terminar».
4. **Verificar** — `kanban-verifier` (Haiku): puerta de calidad.
5. **Revisar** — tú revisas el diff completo (una sola conexión, cierre, eco propio) y me preparas la prueba con dos navegadores. Si algo falla, encarga el arreglo a un `kanban-implementer` y vuelve a verificar.

## Hecho cuando

- [ ] `vp check` y `vp test` en verde.
- [ ] Dos navegadores (lo compruebo yo): Ana mueve una tarjeta en
      `proj_agentic_kanban` y Luis la ve moverse sin refrescar; Ana no nota
      saltos al mover dos tarjetas seguidas.
- [ ] Luis no puede escuchar `proj_ana_notes` (404).

## Al terminar

El implementador encargado de la documentación actualiza `AGENTS.md` y `.cursor/rules/web.mdc` (cliente realtime sí; toasts
no). No hagas commit. Cierra con el resumen que pide `AGENTS.md`.
