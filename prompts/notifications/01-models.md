# Sesión 4 · 01 — Comentarios y notificaciones en la base de datos

## Punto de partida

Las Sesiones 1 a 3 están completas: auth y tenants, tablero con
drag-and-drop y tiempo real por SSE con toasts. Todavía no hay comentarios ni
notificaciones.

## Objetivo

Las dos tablas de la última capa, con una migración nueva.

## Requisitos

- `comment`: `id` (text, PK), `workspace_id`, `project_id`, `task_id`,
  `author_id` (FK → `user.id` de Better Auth), `body`, `created_at`.
- `notification`: `id` (text, PK), `workspace_id`, `recipient_user_id` y
  `actor_user_id` (FK → `user.id`), `task_id`, `comment_id`, `kind` (por ahora
  solo `mention`), `read_at` (nullable), `email_to`, `email_subject`,
  `email_body`, `emailed_at` (nullable) y `created_at`.
- Toda fila tenant-owned lleva su `workspace_id`.
- Claves foráneas con `onDelete: "cascade"` hacia workspace, project, task,
  comment y user. libSQL aplica las FK: sin cascada, el `DELETE` de tareas de
  la Sesión 2 fallaría en cuanto una tarea tenga comentarios.
- Índices: `comment (task_id, created_at)`,
  `notification (recipient_user_id, created_at)` y `workspace_id` en ambas.
- Mismo modo de timestamp que el resto de tablas. Una migración nueva; no
  edites las anteriores. Aplícala con
  `docker compose exec api bun run db:migrate` si Compose está arriba.
- `AGENTS.md` y `.cursor/rules/db.mdc` describen las dos tablas; el HTTP
  de comentarios todavía no existe.

## Fuera de alcance

API, UI, parser de menciones, Resend, Socket.IO y despliegue.

## Cómo trabajar

1. **Inspeccionar.** Confirma schema actual, FK existentes, modo de timestamp
   y generación de migraciones.
2. **Implementar.** Tablas, FK con cascada e índices del plan. Implementa
   tablas, reexport, migración generada y documentación; sin API ni UI.
3. **Comprobar.** Aplica la migración dentro de `api`, pasa `vp check` y
   `vp test` y comprueba health. Revisa el SQL, el destinatario y las cascadas.

## Hecho cuando

- [ ] Hay un SQL nuevo en `packages/db/migrations/` con las dos tablas, sus FK
      con cascada e índices, y se aplicó.
- [ ] `vp check` y `vp test` en verde; `GET /api/health` sigue OK.
