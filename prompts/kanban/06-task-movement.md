# Sesión 2 · 06 — Mover una tarea en el backend

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

1. **Inspeccionar.** Confirma rutas y consultas del board, transacciones en `packages/db` y arnés
   de tests.
2. **Implementar.** Contrato y algoritmo transaccional del plan: consulta, ruta, schema y tests.
   Revisa autorización de origen/destino y renumeración, no solo la respuesta.
3. **Comprobar.** Ejecuta `vp check`, `vp test` y las pruebas HTTP de «Hecho cuando» con Ana.
   Examina misma columna, destino vacío, posiciones y destino de otro proyecto.
4. **Revisar y corregir.** Lee tu diff, corrige los problemas confirmados y
   repite los checks afectados. Actualiza la documentación de «Al terminar»
   sin borrar el reparto de modelos. Distingue la evidencia automática y la
   aceptación manual pendiente. CodeRabbit solo por una duda importante;
   el cierre del conjunto se decide en el 08.

## Hecho cuando

- [ ] `vp check` y `vp test` en verde.
- [ ] HTTP: Ana mueve `task_kanban_1` a `col_kanban_done` → 200 y el board
      refleja el orden nuevo; Ana mueve `task_kanban_1` a `col_ana_todo` → 404.

## Al terminar

El implementador que cierra el paso actualiza `AGENTS.md` (mover sí; drag-and-drop no). No hagas commit. Cierra
con el resumen que pide `AGENTS.md`.
