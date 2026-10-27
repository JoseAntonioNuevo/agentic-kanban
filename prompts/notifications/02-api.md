# Sesión 4 · 02 — La API de comentarios

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
- `AGENTS.md` describe los comentarios por HTTP; las menciones todavía no
  existen.

## Fuera de alcance

Menciones, email, campana, publicación por SSE y frontend. No cambies las
rutas del tablero ni el stream.

## Cómo trabajar

1. **Inspeccionar.** Confirma rutas, `requireSession`, consultas `ForMember`
   y arnés de tests.
2. **Implementar.** Schemas, rutas y firmas del plan. Escribe primero
   `comment.ts`; después consultas, rutas, montaje, tests y documentación.
3. **Comprobar.** Ejecuta `vp check`, `vp test` y las pruebas HTTP de «Hecho
   cuando» por `:5173`. Revisa autor desde la sesión, autorización por la
   tarea y fechas ISO.

## Hecho cuando

- [ ] `vp check` y `vp test` en verde.
- [ ] HTTP por `:5173`: Ana comenta en `task_kanban_1` → 201; Luis
      `GET /api/tasks/task_ana_1/comments` → 404.
