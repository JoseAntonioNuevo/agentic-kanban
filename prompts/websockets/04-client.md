# Sesión 3 · 04 — El cliente parchea la caché

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

**Cursor: Agent con Opus 5.5 orquestando de forma autónoma; Grok 4.7 xhigh
Fast ejecuta.** Lee `AGENTS.md`, `prompts/CURSOR.md`,
`prompts/websockets/README.md`, las reglas implicadas y el código. Usa
`kanban-grok-worker` y pasa `model: "grok-4.7-xhigh-fast"` explícito en cada
nueva Task si está en el catálogo; aplica el protocolo común si cambia.
No uses omisión, `inherit`, Claude, agentes históricos ni subagentes integrados.

Este prompt autoriza el paso y sus correcciones locales. Opus coordina,
fija contratos y revisa; Grok inspecciona, implementa, prueba y actualiza el
estado documentado. Continúa sin «adelante» ni aprobación rutinaria del plan.
No hagas commit, no escribas tú la app ni implementes pasos siguientes.

1. **Inspección (Grok).** Confirma `use-board`, `boardQueryKey`, `mutationKey`,
   `BoardScreen` y `applyBoardMove`.
2. **Contratos y reparto (Opus); implementación (Grok).** Firma del hook y tratamiento del eco propio. Con contratos estables, puede
   dividir `applyBoardEvent` y sus tests por un lado, y `useBoardEvents` y
   montaje por otro; asigna `board.ts` y documentación a un único propietario.
3. **Comprobaciones y revisión.** Grok pasa `vp check` y `vp test` y prepara la prueba con dos navegadores.
   Opus revisa una conexión, cierre, reconexión y eco mientras hay una
   mutation en curso. No da por realizada la prueba manual si no se observó.
4. **Correcciones (Grok).** Opus contrasta diff y evidencia y encarga los
   arreglos confirmados; espera los resultados y repite los checks afectados.
   La puerta general se ejecuta sobre integración estable. CodeRabbit solo
   ante una duda importante que aporte valor, conservando alcance y cobertura;
   no se exige una pasada al terminar cada prompt.

## Hecho cuando

- [ ] `vp check` y `vp test` en verde.
- [ ] Dos navegadores (lo compruebo yo): Ana mueve una tarjeta en
      `proj_agentic_kanban` y Luis la ve moverse sin refrescar; Ana no nota
      saltos al mover dos tarjetas seguidas.
- [ ] Luis no puede escuchar `proj_ana_notes` (404).

## Al terminar

El implementador que cierra el paso actualiza `AGENTS.md` y `.cursor/rules/web.mdc` (cliente realtime sí; toasts
no). No hagas commit. Cierra con el resumen que pide `AGENTS.md`.
