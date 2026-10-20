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

1. **Inspeccionar.** Confirma exports reales de `@dnd-kit/react` 0.5.1 en
   `node_modules/@dnd-kit/react/*.d.ts`, `use-board`, mutations y componentes.
2. **Implementar.** Flujo arrastre → caché → API → rollback del plan. Implementa
   `applyBoardMove` y tests, `useMoveTask`, integración de dnd-kit y documentación.
   Usa las APIs instaladas, sin descargar ni migrar paquetes.
3. **Comprobar.** Ejecuta `vp check` y `vp test`; revisa fuente única y rollback completo.
   Prepara la prueba manual incluida la caída controlada de `api` y su
   restauración; solo se marca observada cuando el profesor la realiza.
4. **Revisar y corregir.** Lee tu diff, corrige los problemas confirmados y
   repite los checks afectados. Actualiza la documentación de «Al terminar»
   sin borrar el reparto de modelos. Distingue la evidencia automática y la
   aceptación manual pendiente. CodeRabbit solo por una duda importante;
   el cierre del conjunto se decide en el 08.

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
