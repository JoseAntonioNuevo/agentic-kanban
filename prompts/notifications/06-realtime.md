Revisa el hub SSE y los comentarios.

Cuando un comentario se crea por HTTP, anúncialo por el stream del project que ya existe.

Requisitos:

Añade `comment.created` a `boardEventSchema` (unión discriminada, `projectId`, `actorUserId`, comment).
Publica **después** de persistir el comentario (y de las menciones/outbox). Si el POST falla, no publiques.
El cliente parsea el evento y:
- invalida la query de comentarios de ese task **y** la de notifications (campana), también si `actorUserId` es el usuario actual (otra pestaña);
- `toast.info` solo si `actorUserId !== yo`.
No ignores el evento entero en skip-self: el toast no es la campana. `comment.created` avisa el hilo; la fila de la campana la creó el POST de 04 si había `@Luis`.
No abras un segundo EventSource. Reutiliza `useBoardEvents` y `GET /api/projects/:projectId/events`.
HTTP sigue siendo la escritura. Data-only SSE (`onmessage`).
No Socket.IO, no campana duplicada, no Resend.

Plan primero: shape del evento, publish, cómo se aplica en cache, archivos.
Luego implementa. Actualiza `AGENTS.md`.

Verificación: `vp check --no-fmt`.
Aula: Ana comenta `@Luis mira esto` (botón Comentar) en `proj_agentic_kanban`. Luis, otra sesión, board abierto: hilo sin refrescar, toast “Nuevo comentario de Ana”, campana con la mención. Ana no ve toast ni fila en su campana.
