# Sesión 2 · 06 — Mover una tarea en el backend

Tiempo en clase: ~10 min. Antes de lanzar a los implementadores, presenta un plan de 12 líneas
como máximo (contrato, algoritmo, transacción y tests) y espera mi «adelante».

## Punto de partida

CRUD de tareas por HTTP (03) y tablero en la interfaz (05). Todavía no se
puede mover una tarea.

## Objetivo

Una sola operación de backend que reordena una tarea dentro de su columna o la
mueve a otra columna del mismo project, con posiciones siempre consistentes.

## Contrato que fijas aquí

`POST /api/tasks/:taskId/move` con body `moveTaskBodySchema`
(`{ columnId, position }`) → 200 con la tarea ya movida (`taskSchema`). La
ruta va en `apps/api/src/routes/board.ts`.

## Requisitos

- Algoritmo simple y determinista: saca la tarea de su columna, insértala en
  la de destino en `position` acotada a `0..n` y renumera 0..n-1 las columnas
  afectadas. Todo dentro de una transacción de Drizzle.
- Autorización: sin sesión → 401; la tarea se busca por la membresía del
  `workspace_id` de su fila (si no, 404); la columna de destino debe existir y
  ser del **mismo project** que la tarea (si no, 404). Así se rechazan los
  movimientos entre projects y entre workspaces aunque el usuario sea miembro
  de ambos. Nunca 403 y nunca autorizar con IDs del cliente.
- Input inválido (posición negativa, `columnId` vacío) → 400.
- Datos solo vía `@agentic-kanban/db`.
- Tests: reordenar dentro de la misma columna; mover a otra columna; mover a
  una columna vacía; posiciones 0..n-1 sin huecos después de cada caso; Ana
  moviendo una tarea de `proj_agentic_kanban` a una columna de
  `proj_ana_notes` → 404 (fixtures equivalentes en la base de test); un no
  miembro → 404; body inválido → 400.

## Fuera de alcance

Drag-and-drop en el frontend y realtime.

## Cómo trabajar

Sigue el flujo con subagentes de `AGENTS.md` (Agent workflow). En este paso:

- **Investigar** (Haiku): rutas y consultas del board, cómo se usan las transacciones en `packages/db` y el arnés de tests.
- **Planificar** (Opus): describe en el brief el contrato y el algoritmo con su transacción, paso a paso.
- **Implementar** (Sonnet): dos en paralelo: A, consulta transaccional, ruta y schema; B, tests contra el contrato. Uno de ellos actualiza la documentación de «Al terminar».
- **Verificar** (Haiku): puerta de calidad y pruebas HTTP de «Hecho cuando» con la cookie de Ana.
- **Revisar** (Opus): mira con lupa la transacción y la autorización.

## Hecho cuando

- [ ] `vp check` y `vp test` en verde.
- [ ] HTTP: Ana mueve `task_kanban_1` a `col_kanban_done` → 200 y el board
      refleja el orden nuevo; Ana mueve `task_kanban_1` a `col_ana_todo` → 404.

## Al terminar

El implementador que cierra el paso actualiza `AGENTS.md` (mover sí; drag-and-drop no). No hagas commit. Cierra
con el resumen que pide `AGENTS.md`.
