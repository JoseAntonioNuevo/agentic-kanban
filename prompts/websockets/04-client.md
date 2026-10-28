# Sesión 3 · 04 — El cliente parchea la caché

## Punto de partida

El servidor publica `task.created`, `task.updated`, `task.deleted` y
`task.moved` por el WebSocket de `GET /api/projects/:projectId/events` (02 y
03). `BoardScreen` pinta el tablero con `useBoard` y
`boardQueryKey(projectId, userId)`. Las mutations llevan una `mutationKey` que
empieza por `["board", projectId]` (Sesión 2).

## Objetivo

Que Luis vea los cambios de Ana sin refrescar, sin romper la actualización
optimista de Ana.

## Contratos que fijas aquí

- `applyBoardEvent(board, event)`: función pura junto a `applyBoardMove` en
  `packages/schemas/src/board.ts`, con `import type { BoardEvent }` para no
  crear un ciclo de valores. Es idempotente y devuelve la misma referencia
  cuando no hay nada que cambiar:
  - `task.created`: si el id ya está en el board, o la columna no está, no
    cambia nada. Si no, inserta la tarea en `task.position` (acotada) de su
    columna y renumera `0..n-1`.
  - `task.updated`: copia `title` y `description` en la tarea con ese id sin
    moverla. Si no está, no cambia nada.
  - `task.deleted`: elimina la tarea y renumera su columna. Si no está, no
    cambia nada.
  - `task.moved`: reutiliza `applyBoardMove`.
  - Usa un `switch` exhaustivo sobre `event.type`: la Sesión 4 añadirá
    `comment.created`.
- `useBoardEvents(projectId, userId, enabled)` en
  `apps/web/src/hooks/use-board-events.ts`, montado por `BoardScreen`:
  - `enabled` es verdadero solo mientras `BoardScreen` pinta el tablero, es
    decir, cuando hay `board.data` y el error no es `BoardNotFoundError`.
  - Un project 404 nunca abre canal.
  - El 05 le añadirá reconexión y avisos, y la Sesión 4 lo ampliará en lugar
    de abrir otra conexión.

## Requisitos

- Conexión:
  - Un solo `WebSocket` por tablero, abierto en un `useEffect` que depende de
    `projectId`, `userId` y `enabled`.
  - URL `/api/projects/${encodeURIComponent(projectId)}/events` en el mismo
    origen: `ws:` o `wss:` según `location.protocol`, con `location.host`.
  - La cookie viaja sola al abrir; nunca apuntes a `:3000`.
  - El cleanup cierra el socket: al desmontar, al cambiar de project o
    cuando `enabled` pasa a falso.
- Al abrir (`onopen`), invalida la query del board. Lo que pasó entre la
  lectura del board y la apertura del canal no se repite, porque el hub no
  guarda historial.
- `onmessage`:
  - `JSON.parse` dentro de `try` y `boardEventSchema.safeParse`.
  - Ignora lo que no parsea y los eventos de otro `projectId`.
  - El cliente no envía nada por el socket.
- Aplica el evento con
  `setQueryData(boardQueryKey(projectId, userId), (b) => b && applyBoardEvent(b, event))`.
  - La queryKey del board es `["board", userId, projectId]`; la `mutationKey`
    empieza por `["board", projectId]`. No las confundas.
  - Si en ese momento el board se está recargando
    (`queryClient.isFetching({ queryKey }) > 0`), invalídalo además, porque
    esa respuesta pudo salir antes de la escritura y pisaría el evento.
- Eventos propios (`actorUserId` igual al usuario):
  - Si en esta pestaña hay una mutation del tablero en curso
    (`queryClient.isMutating({ mutationKey: ["board", projectId] }) > 0`),
    ignóralos, porque su `onSettled` ya reconcilia.
  - Si no, aplícalos: son idempotentes y mantienen sincronizada otra pestaña
    del mismo usuario.
- En desarrollo, `StrictMode` monta dos veces. Que el primer socket se cierre
  y el navegador avise «closed before the connection is established» es
  esperado; lo que no puede quedar es más de una conexión abierta.
- TanStack Query sigue siendo la única fuente del estado del servidor: no
  copies el board a `useState`. Sin reconexión ni toasts todavía y sin
  librerías nuevas de realtime.
- Tests de `applyBoardEvent`:
  - Cada tipo de evento.
  - Idempotencia: aplicarlo dos veces da lo mismo que una, y la segunda vez
    devuelve la misma referencia.
  - Tarea o columna que no están en el board, y `task.created` con un id
    existente: misma referencia.
- `AGENTS.md` y `.cursor/rules/web.mdc` describen el cliente realtime; la
  reconexión y los toasts todavía no existen.

## Fuera de alcance

Reconexión, toasts, presencia, comentarios, escrituras por el WebSocket y
Socket.IO.

## Cómo trabajar

1. **Inspeccionar.** Confirma `use-board`, `boardQueryKey`, las `mutationKey`
   de `use-task-mutations` y `use-move-task`, las ramas de `BoardScreen` y
   `applyBoardMove`.
2. **Implementar.** `applyBoardEvent` y sus tests, `useBoardEvents`, su
   montaje en `BoardScreen` y la documentación.
3. **Comprobar.** Ejecuta `vp check` y `vp test`. Revisa una conexión por
   tablero, el cierre al salir, que no se abre canal sin board y el eco
   mientras hay una mutation en curso. Prepara la prueba con dos navegadores.

## Hecho cuando

- [ ] `vp check` y `vp test` en verde.
- [ ] Dos navegadores (lo compruebo yo):
  - Ana crea, edita, mueve y borra en `proj_agentic_kanban`, y Luis ve cada
    cambio sin refrescar.
  - Ana no nota saltos al mover dos tarjetas seguidas.
- [ ] DevTools → Network → WS en Luis: una sola conexión `events` abierta
      con el tablero; al pulsar «Volver» se cierra y no aparece otra.
- [ ] «Probar el canal» como Luis en `proj_ana_notes` no llega a abrirse
      (404 antes del upgrade).
