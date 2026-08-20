Revisa el estado actual del repo antes de proponer cambios.

Estamos construyendo notificaciones de la Sesión 4.

Añade el modelo de datos mínimo para:

- comment
- notification

Requisitos:

comment pertenece a task, project y workspace. Tiene author_id (FK a user.id de Better Auth) y body.
notification pertenece a workspace. Lleva recipient_user_id, actor_user_id, task_id, comment_id, kind (por ahora solo `mention`), read_at nullable, y los campos del email generado (to, subject, body) más emailed_at nullable.
Toda fila tenant-owned lleva workspace_id.
Mantén las reglas de aislamiento multi-tenant existentes.
Usa Drizzle.
Genera una migración nueva. No modifiques migraciones anteriores.
No añadas API, UI, parseo de @menciones, Resend, Socket.IO ni deploy.

Primero analiza el código existente y propón el plan mínimo: schema, FKs, índices y constraints.
Luego implementa. Actualiza `AGENTS.md`: tablas sí; HTTP de comentarios no.

Verificación: `vp check --no-fmt`; el SQL nuevo está en `packages/db/migrations/`.
