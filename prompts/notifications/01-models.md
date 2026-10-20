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

## Fuera de alcance

API, UI, parser de menciones, Resend, Socket.IO y despliegue.

## Cómo trabajar

**Cursor: Agent con Opus 5.5 orquestando de forma autónoma; Grok 4.7 xhigh
Fast ejecuta.** Lee `AGENTS.md`, `prompts/CURSOR.md`,
`prompts/notifications/README.md`, las reglas implicadas y el código. Usa
`kanban-grok-worker` y pasa `model: "grok-4.7-xhigh-fast"` explícito en cada
nueva Task si está en el catálogo; aplica el protocolo común si cambia.
No uses omisión, `inherit`, Claude, agentes históricos ni subagentes integrados.

Este prompt autoriza el paso y sus correcciones locales. Opus coordina,
fija contratos y revisa; Grok inspecciona, implementa, prueba y actualiza el
estado documentado. Continúa sin «adelante» ni aprobación rutinaria del plan.
No hagas commit, no escribas tú la app ni implementes pasos siguientes.

1. **Inspección (Grok).** Confirma schema actual, FK existentes y modo de timestamp.
2. **Contratos y reparto (Opus); implementación (Grok).** Tablas, FK con cascada e índices. Un worker escribe tablas, reexport,
   migración generada y documentación. No añadas API ni UI en este paso.
3. **Comprobaciones y revisión.** Grok aplica la migración dentro de `api`, pasa `vp check`, `vp test` y
   comprueba health. Opus revisa SQL, destinatario y cascadas.
4. **Correcciones (Grok).** Opus contrasta diff y evidencia y encarga los
   arreglos confirmados; espera los resultados y repite los checks afectados.
   La puerta general se ejecuta sobre integración estable. CodeRabbit solo
   ante una duda importante que aporte valor, conservando alcance y cobertura;
   no se exige una pasada al terminar cada prompt.

## Hecho cuando

- [ ] Hay un SQL nuevo en `packages/db/migrations/` con las dos tablas, sus FK
      con cascada e índices, y se aplicó.
- [ ] `vp check` y `vp test` en verde; `GET /api/health` sigue OK.

## Al terminar

El implementador que cierra el paso actualiza `AGENTS.md` (tablas sí; HTTP de comentarios no) y
`.cursor/rules/db.mdc`. No hagas commit. Cierra con el resumen que pide
`AGENTS.md`.
