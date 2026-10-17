# Sesión 2 · 07 — Drag-and-drop optimista

## Punto de partida

`POST /api/tasks/:taskId/move` funciona (06). El tablero se pinta desde
TanStack Query con `useBoard` (05). `@dnd-kit/react` 0.5.1 está instalado y sin
usar.

## Objetivo

Arrastrar tareas para reordenarlas en su columna, moverlas a otra o soltarlas
en una columna vacía, con respuesta inmediata y rollback visible si el
servidor falla.

## Contratos que fijas aquí

- `applyBoardMove(board, { taskId, columnId, position })`: función pura en
  `packages/schemas/src/board.ts`, exportada desde `@agentic-kanban/schemas`,
  con el mismo orden que aplica el servidor. La Sesión 3 la reutilizará para
  los eventos de otros usuarios.
- `useMoveTask(projectId, userId)` en `apps/web/src/hooks/use-move-task.ts`,
  con `mutationKey: ["board", projectId, "move"]`.

## Requisitos

- **dnd-kit 0.5.1.** Antes de escribir código, lee los exports instalados en
  `node_modules/@dnd-kit/react/*.d.ts`: la API de esta versión no es la de
  `@dnd-kit/core`. Usa `DragDropProvider` de `@dnd-kit/react` y `useSortable`
  de `@dnd-kit/react/sortable` (con `id`, `index` y `group` igual al id de la
  columna), y un destino droppable para que las columnas vacías acepten
  tareas. `@dnd-kit/helpers` **no** está instalado: no lo instales ni instales
  los paquetes legacy (`@dnd-kit/core`, `@dnd-kit/sortable`). En `onDragEnd`
  ignora las operaciones canceladas y calcula columna y posición de destino a
  partir de `operation.source` y `operation.target` (`isSortable`, `group`,
  `index`, `initialGroup`, `initialIndex`); si no cambió nada, no llames a la
  API.
- **Optimista con TanStack Query.** En `onMutate`: cancela las queries del
  board, guarda la instantánea y aplica `applyBoardMove` a la caché. En
  `onError`: restaura la instantánea y muestra `toast.error`. En `onSettled`:
  invalida el board. El backend sigue siendo la autoridad final y el
  movimiento debe persistir tras refrescar.
- La caché de Query es la única fuente del estado del servidor: no guardes una
  copia del board en `useState` (el estado interno de dnd-kit durante el
  arrastre está bien). dnd-kit reordena el DOM mientras arrastras; si después
  de soltar el orden visual y la caché no coinciden, remonta el proveedor con
  una `key` derivada del orden del board (es lo que funcionó en el ensayo).
- Tests de `applyBoardMove`: misma columna, otra columna, columna vacía,
  posición fuera de rango (se acota) y tarea inexistente (board sin cambios).

## Fuera de alcance

Realtime, comentarios y notificaciones de otros usuarios.

## Cómo trabajar

Sigue los cinco pasos de `AGENTS.md`. Tú planificas y, al final, corriges. Hasta el «adelante» no se editan ficheros. No hagas commit.

En este paso:

- **Investigar.** `kanban-recon`: dos en paralelo: uno con los exports reales de `@dnd-kit/react` 0.5.1 (`node_modules/@dnd-kit/react/*.d.ts`) y otro con cómo se pinta hoy el tablero (`use-board`, mutations, componentes).
- **Planificar.** Tú, y espera mi «adelante»: flujo arrastre → caché → API → rollback.
- **Implementar.** `kanban-implementer`: dos en paralelo: A, `applyBoardMove` y sus tests; B, `useMoveTask` e integración de dnd-kit en los componentes del tablero. Uno de ellos actualiza la documentación de «Al terminar».
- **Verificar.** `kanban-verifier`: puerta de calidad.
- **Revisar.** Tú: fuente única y rollback completo; después prepárame los pasos de la prueba manual, incluido el fallo forzado.

## Hecho cuando

- [ ] `vp check` y `vp test` en verde.
- [ ] Navegador (lo compruebo yo): reordenar en la misma columna, mover a otra,
      soltar en una vacía; refrescar y el orden se mantiene.
- [ ] Fallo forzado: con `docker compose stop api`, mover una tarjeta → vuelve
      a su sitio y aparece el aviso; después `docker compose start api`.

## Al terminar

El implementador que cierra el paso actualiza `AGENTS.md` (drag-and-drop sí; realtime y comentarios no) y quita de
`.cursor/rules/web.mdc` la frase que prohíbe implementar drag-and-drop. No
hagas commit. Cierra con el resumen que pide `AGENTS.md`.
