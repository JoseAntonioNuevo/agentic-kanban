# Sesión 2 · 03 — La API del tablero

Tiempo en clase: ~10 min. Antes de editar nada, presenta un plan de 15 líneas
como máximo y espera mi «adelante».

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

Usa los subagentes de `.claude/agents/`. Si tu herramienta no los tiene, haz
tú los pasos en el mismo orden.

1. Tú (Opus): schemas y firmas de las consultas, antes de repartir.
2. Dos `kanban-implementer` (Sonnet) en paralelo:
   - A: consultas en `packages/db`, rutas y montaje en `index.ts`.
   - B: tests contra los contratos de arriba.
3. `kanban-verifier` (Haiku): puerta de calidad y pruebas HTTP por el proxy.
4. Tú: revisa el diff buscando cualquier camino sin filtro de tenant.

## Hecho cuando

- [ ] `vp check` y `vp test` en verde.
- [ ] HTTP: Ana `GET /api/projects/proj_agentic_kanban/board` → 200 con 3
      columnas; Luis `GET /api/projects/proj_ana_notes/board` → 404; sin
      cookie → 401.

## Al terminar

Actualiza `AGENTS.md` (contrato del tablero; mover y drag-and-drop todavía
no) y `.cursor/rules/api.mdc`. No hagas commit. Cierra con el resumen que pide
`AGENTS.md`.
