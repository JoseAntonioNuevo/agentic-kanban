Revisa autenticación, autorización y el modelo de comment.

Implementa la API mínima de comentarios:

- GET /api/tasks/:taskId/comments → lista del task, ordenada por created_at
- POST /api/tasks/:taskId/comments `{ body }` → crea un comentario

Requisitos:

Valida input y response con Zod en `@agentic-kanban/schemas`. Incluye `authorName` (join a `user.name`).
Sesión → 401. No miembro o task inexistente → 404 (nunca 403).
`workspace_id` sale de la fila del task, no del cliente.
Datos solo vía `@agentic-kanban/db`.
No implementes @menciones, email, campana, publish SSE de comentarios ni frontend.
No cambies las rutas de board ni el stream de tareas.

Plan primero: endpoints, schemas, flujo de authz, archivos, cómo verificar.
Luego implementa. Actualiza `AGENTS.md`: comentarios HTTP sí; menciones no.

Verificación: `vp check --no-fmt`; tests 401 / 404 Luis en task de Ana / miembro crea y lista.
