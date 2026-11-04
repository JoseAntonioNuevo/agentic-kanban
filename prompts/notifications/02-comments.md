# Sesión 4 · 01 — Comentarios: modelo y API

## Punto de partida

Las Sesiones 1 a 3 están completas: auth y tenants, tablero con
drag-and-drop y tiempo real por WebSocket con toasts. `requireSession`, el
patrón de rutas y el arnés de tests con su propia base existen desde la
Sesión 1. Todavía no hay comentarios ni notificaciones.

## Objetivo

Las dos tablas de la última capa, con una migración nueva, y la API para leer
y crear los comentarios de una tarea con la misma autorización de siempre.

## Contratos que fijas aquí

| Método y ruta                      | Body       | Respuesta                       |
| ---------------------------------- | ---------- | ------------------------------- |
| `GET /api/tasks/:taskId/comments`  | —          | 200 `commentListResponseSchema` |
| `POST /api/tasks/:taskId/comments` | `{ body }` | 201 `commentSchema`             |

- Tablas `comment` y `notification` en `@agentic-kanban/db`.
- `commentSchema` en `packages/schemas/src/comment.ts`:
  `{ id, taskId, projectId, authorId, authorName, body, createdAt }`, con
  `createdAt` como string ISO. `authorName` sale de un join con `user.name`.
- `createCommentBodySchema`: `body` recortado, de 1 a 2000 caracteres.
- Rutas en `apps/api/src/routes/comments.ts`; consultas `ForMember` en
  `@agentic-kanban/db`.

## Requisitos

- **Tablas.**
  - `comment`: `id` (text, PK), `workspace_id`, `project_id`, `task_id`,
    `author_id` (FK → `user.id` de Better Auth), `body`, `created_at`.
  - `notification`: `id` (text, PK), `workspace_id`, `recipient_user_id` y
    `actor_user_id` (FK → `user.id`), `task_id`, `comment_id`, `kind` (por
    ahora solo `mention`), `read_at` (nullable), `email_to`, `email_subject`,
    `email_body`, `emailed_at` (nullable) y `created_at`.
  - Toda fila tenant-owned lleva su `workspace_id`.
  - Claves foráneas con `onDelete: "cascade"` hacia workspace, project, task,
    comment y user. libSQL aplica las FK: sin cascada, el `DELETE` de tareas
    de la Sesión 2 fallaría en cuanto una tarea tenga comentarios.
  - Índices: `comment (task_id, created_at)`,
    `notification (recipient_user_id, created_at)` y `workspace_id` en ambas.
  - Mismo modo de timestamp que el resto de tablas. Una migración nueva; no
    edites las anteriores. Aplícala con
    `docker compose exec api bun run db:migrate` si Compose está arriba.
- **API.**
  - Sin sesión → 401. No miembro o tarea inexistente → 404, nunca 403. El
    `workspace_id` sale de la fila de la tarea, no del cliente.
  - La lista se ordena por `created_at` ascendente.
  - Datos solo vía `@agentic-kanban/db`; respuestas pasadas por `.parse()`.
- Tests con el arnés: 401; Luis lee y comenta en una tarea del workspace
  privado de Ana → 404 en los dos casos; un miembro crea y lista con
  `authorName`; body vacío → 400; borrar una tarea con comentarios sigue
  devolviendo 204 (la cascada funciona).
- `AGENTS.md` y `.cursor/rules/db.mdc` describen las tablas y los comentarios
  por HTTP; las menciones todavía no existen.

## Fuera de alcance

Menciones, envío de email, campana, UI, publicación por WebSocket, Socket.IO
y despliegue. No cambies las rutas del tablero ni el canal de eventos.

## Cómo trabajar

1. **Inspeccionar.** Confirma schema actual, FK existentes, modo de timestamp,
   generación de migraciones, rutas, `requireSession`, consultas `ForMember`
   y arnés de tests.
2. **Implementar.** Tablas, FK, índices, schemas, rutas y firmas del plan.
   Primero tablas y migración; después `comment.ts`, consultas, rutas,
   montaje, tests y documentación.
3. **Comprobar.** Aplica la migración dentro de `api`, ejecuta `vp check`,
   `vp test`, health y las pruebas HTTP de «Hecho cuando» por `:5173`. Revisa
   el SQL y las cascadas, el autor desde la sesión, la autorización por la
   tarea y las fechas ISO.

## Hecho cuando

- [ ] Hay un SQL nuevo en `packages/db/migrations/` con las dos tablas, sus FK
      con cascada e índices, y se aplicó.
- [ ] `vp check` y `vp test` en verde; `GET /api/health` sigue OK.
- [ ] HTTP por `:5173`: Ana comenta en `task_kanban_1` → 201; Luis
      `GET /api/tasks/task_ana_1/comments` → 404.
