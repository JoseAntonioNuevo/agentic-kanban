# Sesión 4 · 02 — Comentarios: modelo y API

## Punto de partida

La app de la clase 3 está publicada en `https://thepower-kanban.josenuevo.dev`
(01). `requireSession`, el patrón de rutas y consultas `ForMember`, `nowMs()`
en `packages/db/src/schema/timestamps.ts` y el arnés de tests con su propia
base existen desde las sesiones anteriores. Todavía no hay comentarios ni
notificaciones.

## Objetivo

Las dos tablas de la última capa, con una migración nueva, y la API para leer
y crear los comentarios de una tarea con la misma autorización de siempre.

## Contratos que fijas aquí

| Método y ruta                      | Body       | Respuesta                       |
| ---------------------------------- | ---------- | ------------------------------- |
| `GET /api/tasks/:taskId/comments`  | —          | 200 `commentListResponseSchema` |
| `POST /api/tasks/:taskId/comments` | `{ body }` | 201 `commentSchema`             |

- Tablas `comment` y `notification` en `@agentic-kanban/db`
  (`packages/db/src/schema/comment.ts` y
  `packages/db/src/schema/notification.ts`, reexportadas desde
  `packages/db/src/schema/index.ts` y `packages/db/src/index.ts`).
- En `packages/schemas/src/comment.ts`, exportados con sus tipos (`Comment`,
  `CommentListResponse`, `CreateCommentBody`) desde `@agentic-kanban/schemas`:
  - `commentSchema`:
    `{ id, taskId, projectId, authorId, authorName, body, createdAt }`, con
    `createdAt` como `z.iso.datetime()`. `authorName` sale de un join con
    `user.name`.
  - `commentListResponseSchema`: `z.array(commentSchema)`.
  - `createCommentBodySchema`: `body` recortado
    (`z.string().trim().min(1).max(2000)`).
  - Reutiliza `taskIdParamSchema` de `board.ts` para `:taskId`.
- Consultas `listCommentsForMember(taskId, userId)` y
  `createCommentForMember(taskId, userId, body)` en
  `packages/db/src/queries/comments.ts`, reexportadas desde
  `@agentic-kanban/db`.
- Rutas en `apps/api/src/routes/comments.ts` (`commentRoutes`), montadas en
  `apps/api/src/index.ts`.

## Requisitos

- **Tablas.**
  - `comment`: `id` (text, PK), `workspaceId` (`workspace_id`), `projectId`
    (`project_id`), `taskId` (`task_id`), `authorId` (`author_id`, FK →
    `user.id` de Better Auth), `body` (text, not null), `createdAt`
    (`created_at`, `timestamp_ms` con `nowMs()`).
  - `notification`: `id` (text, PK), `workspaceId` (`workspace_id`),
    `recipientUserId` (`recipient_user_id`, FK → `user.id`), `actorUserId`
    (`actor_user_id`, FK → `user.id`), `taskId` (`task_id`, FK → `task.id`),
    `commentId` (`comment_id`, FK → `comment.id`), `kind` (text, not null; por
    ahora solo `"mention"`), `readAt` (`read_at`, `timestamp_ms` nullable),
    `emailTo` (`email_to`, text, not null), `emailSubject` (`email_subject`,
    text, not null), `emailBody` (`email_body`, text, not null), `emailedAt`
    (`emailed_at`, `timestamp_ms` nullable) y `createdAt` (`created_at`,
    `timestamp_ms` con `nowMs()`).
  - Toda fila tenant-owned lleva su `workspace_id`.
  - Claves foráneas con `onDelete: "cascade"` hacia `workspace`, `project`,
    `task`, `comment` y `user`. libSQL aplica las FK: sin cascada, el `DELETE`
    de tareas de la Sesión 2 fallaría en cuanto una tarea tenga comentarios.
  - Índices: `comment (task_id, created_at)`,
    `notification (recipient_user_id, created_at)` y `workspace_id` en ambas.
  - Una migración nueva generada en el host (`bun run db:generate`); no edites
    las anteriores. Aplícala con
    `docker compose exec api bun run db:migrate` si Compose está arriba. En
    producción la aplicará la imagen al arrancar tras el redeploy del 06; no
    despliegues en este paso.
- **API.**
  - Cadena de cada ruta: `requireSession` (401 sin sesión) → `zValidator` →
    consulta `ForMember`. No miembro o tarea inexistente → 404, nunca 403. El
    `workspace_id` y el `project_id` salen de la fila de la tarea, no del
    cliente, y `author_id` sale de la sesión (`c.get("userId")`).
  - La lista se ordena por `created_at` ascendente (y `id` ascendente).
  - Datos solo vía `@agentic-kanban/db`; fechas serializadas con
    `toISOString()` y respuestas pasadas por `.parse()`.
- Tests con el arnés:
  - `packages/schemas/src/comment.test.ts`: parse válido y rechazos (`body`
    vacío o de más de 2000 caracteres, `createdAt` no ISO).
  - `apps/api/src/routes/comments.test.ts`: 401 sin sesión; Luis lee y comenta
    en una tarea del workspace privado de Ana → 404 en los dos casos; un
    miembro crea (201) y lista (200) con `authorName`; `body` vacío → 400;
    borrar una tarea con comentarios sigue devolviendo 204 (la cascada
    funciona).
- `AGENTS.md`, `.cursor/rules/db.mdc`, `.cursor/rules/schemas.mdc` y
  `.cursor/rules/api.mdc` describen las tablas y los comentarios por HTTP; las
  menciones todavía no existen.

## Fuera de alcance

Menciones, email, campana, UI, publicación por WebSocket, Socket.IO y
redeploy. No cambies las rutas del tablero ni el canal de eventos.

## Cómo trabajar

1. **Inspeccionar.** Confirma schema actual, FK existentes, `nowMs()`,
   generación de migraciones, rutas, `requireSession`, consultas `ForMember` y
   arnés de tests.
2. **Implementar.** Primero las tablas y la migración; después `comment.ts` en
   schemas, las consultas en `db`, `routes/comments.ts` y su montaje en
   `index.ts`, los tests y la documentación.
3. **Comprobar.** Aplica la migración dentro de `api`, ejecuta `vp check`,
   `vp test`, health y las pruebas HTTP de «Hecho cuando» por `:5173`. Revisa
   el SQL y las cascadas, el autor desde la sesión, la autorización por la
   tarea y las fechas ISO.

## Hecho cuando

- [ ] Hay un SQL nuevo en `packages/db/migrations/` con las dos tablas, sus FK
      con cascada e índices, y se aplicó dentro de `api`.
- [ ] `vp check` y `vp test` en verde; `GET /api/health` sigue OK.
- [ ] «Pruebas HTTP de comentarios y notificaciones» de
      `prompts/notifications/README.md` por `:5173`: sin cookie → 401; Luis
      `GET /api/tasks/task_ana_1/comments` → 404; Ana comenta en
      `task_kanban_1` → 201.
