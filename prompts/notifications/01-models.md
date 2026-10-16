# Sesión 4 · 01 — Comentarios y notificaciones en la base de datos

Tiempo en clase: ~5 min. Tú no editas código: orquestas. Antes de lanzar a los implementadores, presenta un plan de 10 líneas
como máximo y espera mi «adelante».

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

## Fuera de alcance

API, UI, parser de menciones, Resend, Socket.IO y despliegue.

## Cómo trabajar

Tú (Opus) orquestas y no editas ficheros: investigan los subagentes Haiku, implementa Sonnet y verifica Haiku. Usa los subagentes de `.claude/agents/`; si tu herramienta no los tiene, haz los mismos pasos en este orden.

1. **Investigar** — `kanban-recon` (Haiku): schema actual, FK existentes y modo de timestamp.
2. **Planificar** — tú: columnas, FK con cascada e índices. Presenta el plan y espera mi «adelante».
3. **Implementar** — `kanban-implementer` (Sonnet): uno solo: tablas, reexport, migración generada y documentación de «Al terminar».
4. **Verificar** — `kanban-verifier` (Haiku): aplica la migración, pasa la puerta de calidad y comprueba health.
5. **Revisar** — tú revisas el diff completo. Si algo falla, encarga el arreglo a un `kanban-implementer` y vuelve a verificar.

## Hecho cuando

- [ ] Hay un SQL nuevo en `packages/db/migrations/` con las dos tablas, sus FK
      con cascada e índices, y se aplicó.
- [ ] `vp check` y `vp test` en verde; `GET /api/health` sigue OK.

## Al terminar

El implementador encargado de la documentación actualiza `AGENTS.md` (tablas sí; HTTP de comentarios no) y
`.cursor/rules/db.mdc`. No hagas commit. Cierra con el resumen que pide
`AGENTS.md`.
