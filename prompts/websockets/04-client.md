# Sesión 3 · 04 — El cliente parchea la caché

## Punto de partida

El servidor publica `task.created`, `task.updated`, `task.deleted` y
`task.moved` por `GET /api/projects/:projectId/events` (02 y 03). El tablero se
pinta con `useBoard` y `boardQueryKey(projectId, userId)`, y las mutations
llevan una `mutationKey` que empieza por `["board", projectId]` (Sesión 2).

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
  `setQueryData(boardQueryKey(projectId, userId), (b) => b && applyBoardEvent(b, event))`.
  La queryKey del board es `["board", userId, projectId]`; la `mutationKey`
  empieza por `["board", projectId]`. No las confundas.
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
- `AGENTS.md` y `.cursor/rules/web.mdc` describen el cliente realtime; los
  toasts todavía no existen.

## Fuera de alcance

Toasts, presencia, comentarios y Socket.IO.

## Cómo trabajar

1. **Inspeccionar.** Confirma `use-board`, `boardQueryKey`, las `mutationKey`
   de `use-task-mutations` y `use-move-task`, `BoardScreen` y `applyBoardMove`.
2. **Implementar.** Firma del hook y tratamiento del eco propio del plan.
   Implementa `applyBoardEvent` y sus tests, `useBoardEvents`, su montaje y la
   documentación.
3. **Comprobar.** Ejecuta `vp check` y `vp test`. Revisa una conexión por
   tablero, cierre, reconexión y eco mientras hay una mutation en curso, y
   prepara la prueba con dos navegadores.

## Hecho cuando

- [ ] `vp check` y `vp test` en verde.
- [ ] Dos navegadores (lo compruebo yo): Ana mueve una tarjeta en
      `proj_agentic_kanban` y Luis la ve moverse sin refrescar; Ana no nota
      saltos al mover dos tarjetas seguidas.
- [ ] Luis no puede escuchar `proj_ana_notes` (404).
