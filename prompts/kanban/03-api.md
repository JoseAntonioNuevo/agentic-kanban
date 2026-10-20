# Sesión 2 · 03 — La API del tablero

## Punto de partida

Tablas `column` y `task` (01) y seed del tablero (02). De la Sesión 1 ya
existen `requireSession`, `getProjectForMember`, el patrón de rutas y el arnés
de tests de API con su propia base.

## Objetivo

Leer el tablero y crear, editar y borrar tareas, con la misma cadena de
autorización que la Sesión 1.

## Contratos que fijas aquí

| Método y ruta                         | Body                                  | Respuesta                 |
| ------------------------------------- | ------------------------------------- | ------------------------- |
| `GET /api/projects/:projectId/board`  | —                                     | 200 `boardResponseSchema` |
| `POST /api/projects/:projectId/tasks` | `{ columnId, title, description? }`   | 201 `taskSchema`          |
| `PATCH /api/tasks/:taskId`            | `{ title?, description? }` (uno mín.) | 200 `taskSchema`          |
| `DELETE /api/tasks/:taskId`           | —                                     | 204                       |

- Schemas en `packages/schemas/src/board.ts`: `taskSchema`, `boardColumnSchema`,
  `boardResponseSchema` (`{ project, columns: [{ …column, tasks: [...] }] }`,
  todo ordenado por `position`), `createTaskBodySchema`, `updateTaskBodySchema`
  y `taskIdParamSchema`. Fechas como string ISO.
- Rutas en `apps/api/src/routes/board.ts` (`boardRoutes`). La Sesión 3
  publicará eventos desde aquí.
- Consultas en `@agentic-kanban/db` con el sufijo `ForMember` (por ejemplo
  `getBoardForMember(projectId, userId)`).

## Requisitos

- Sin sesión → 401. Si el usuario no es miembro o el recurso no existe → 404,
  nunca 403.
- Los IDs que manda el cliente (`projectId`, `columnId`, `taskId`) solo
  identifican; nunca autorizan. La membresía se comprueba con el
  `workspace_id` de la fila, y al crear, `columnId` debe pertenecer al mismo
  project (si no, 404). Así no hay IDOR.
- Input inválido → 400 (lo que devuelve `@hono/zod-validator`). Las
  respuestas pasan por `.parse()` del schema compartido.
- Crear añade la tarea al final de su columna. Borrar compacta las posiciones
  de esa columna (0..n-1) dentro de una transacción.
- Datos solo vía `@agentic-kanban/db`.
- Tests con el arnés, usando fixtures en la base de test: 401; 404 al pedir el
  board o editar una tarea de un project ajeno; 404 al crear con un `columnId`
  de otro project; 400 con título vacío; crear, editar y borrar con éxito;
  posiciones compactas tras borrar.

## Fuera de alcance

Mover tareas, drag-and-drop, realtime y frontend.

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

1. **Inspeccionar.** Confirma `requireSession`, `getProjectForMember`, rutas, arnés de tests y API
   de transacciones de Drizzle instalada.
2. **Implementar.** Schemas de `board.ts`, consultas en `packages/db`, rutas, montaje y tests
   contra los contratos. Escribe primero los schemas compartidos y después
   integra las capas; no uses otro agente para separar el trabajo.
3. **Comprobar.** Ejecuta `vp check`, `vp test` y las pruebas HTTP de «Hecho cuando» por el
   proxy. Revisa cualquier camino sin filtro de tenant y los casos 400/401/404.
4. **Revisar y corregir.** Lee tu diff, corrige los problemas confirmados y
   repite los checks afectados. Actualiza la documentación de «Al terminar»
   sin borrar el reparto de modelos. Distingue la evidencia automática y la
   aceptación manual pendiente. CodeRabbit solo por una duda importante;
   el cierre del conjunto se decide en el 08.

## Hecho cuando

- [ ] `vp check` y `vp test` en verde.
- [ ] HTTP: Ana `GET /api/projects/proj_agentic_kanban/board` → 200 con 3
      columnas; Luis `GET /api/projects/proj_ana_notes/board` → 404; sin
      cookie → 401.

## Al terminar

El implementador que cierra el paso actualiza `AGENTS.md` (contrato del tablero; mover y drag-and-drop todavía
no) y `.cursor/rules/api.mdc`. No hagas commit. Cierra con el resumen que pide
`AGENTS.md`.
