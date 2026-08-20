Revisa el hub SSE y los comentarios.

Cuando un comentario se crea por HTTP, anúncialo por el stream del project que ya existe.

Requisitos:

Añade `comment.created` a `boardEventSchema` (unión discriminada, `projectId`, `actorUserId`, comment).
Publica **después** de persistir el comentario (y de las menciones/outbox). Si el POST falla, no publiques.
El cliente parsea el evento, ignora `actorUserId === yo`, invalida o parchea la query de comentarios de ese task, y hace toast.info para el otro usuario.
No abras un segundo EventSource. Reutiliza `useBoardEvents` y `GET /api/projects/:projectId/events`.
HTTP sigue siendo la escritura. Data-only SSE (`onmessage`).
No Socket.IO, no campana duplicada, no Resend.

Plan primero: shape del evento, publish, cómo se aplica en cache, archivos.
Luego implementa. Actualiza `AGENTS.md`.

Verificación: `vp check --no-fmt`.
Aula: Ana comenta en `proj_agentic_kanban` y Luis, con el board abierto, ve el comentario sin refrescar.
