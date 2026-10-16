# Sesión 4 · 02 — La API de comentarios

Tiempo en clase: ~5 min. Antes de editar nada, presenta un plan de 12 líneas
como máximo y espera mi «adelante».

## Punto de partida

Tablas `comment` y `notification` (01). `requireSession`, el patrón de rutas y
el arnés de tests con su propia base existen desde la Sesión 1.

## Objetivo

Leer y crear los comentarios de una tarea con la misma autorización de
siempre.

## Contratos que fijas aquí

| Método y ruta                      | Body       | Respuesta                       |
| ---------------------------------- | ---------- | ------------------------------- |
| `GET /api/tasks/:taskId/comments`  | —          | 200 `commentListResponseSchema` |
| `POST /api/tasks/:taskId/comments` | `{ body }` | 201 `commentSchema`             |

- `commentSchema` en `packages/schemas/src/comment.ts`:
  `{ id, taskId, projectId, authorId, authorName, body, createdAt }`, con
  `createdAt` como string ISO. `authorName` sale de un join con `user.name`.
- `createCommentBodySchema`: `body` recortado, de 1 a 2000 caracteres.
- Rutas en `apps/api/src/routes/comments.ts`; consultas `ForMember` en
  `@agentic-kanban/db`.

## Requisitos

- Sin sesión → 401. No miembro o tarea inexistente → 404, nunca 403. El
  `workspace_id` sale de la fila de la tarea, no del cliente.
- La lista se ordena por `created_at` ascendente.
- Datos solo vía `@agentic-kanban/db`; respuestas pasadas por `.parse()`.
- Tests con el arnés: 401; Luis lee y comenta en una tarea del workspace
  privado de Ana → 404 en los dos casos; un miembro crea y lista con
  `authorName`; body vacío → 400; borrar una tarea con comentarios sigue
  devolviendo 204 (la cascada funciona).

## Fuera de alcance

Menciones, email, campana, publicación por SSE y frontend. No cambies las
rutas del tablero ni el stream.

## Cómo trabajar

Usa los subagentes de `.claude/agents/`. Tú (Opus) escribes los schemas y las
firmas. Después, dos `kanban-implementer` (Sonnet) en paralelo: A, consultas y
rutas; B, tests. Al final, `kanban-verifier` (Haiku) pasa la puerta de calidad y
prueba por HTTP: Ana comenta en `task_kanban_1` → 201; Luis
`GET /api/tasks/task_ana_1/comments` → 404.

## Hecho cuando

- [ ] `vp check` y `vp test` en verde.
- [ ] Las dos pruebas HTTP dan 201 y 404.

## Al terminar

Actualiza `AGENTS.md` (comentarios por HTTP sí; menciones no). No hagas
commit. Cierra con el resumen que pide `AGENTS.md`.
