Lee `AGENTS.md` y revisa toda la implementación actual de la Sesión 4 como si estuvieras haciendo una revisión de PR.

No añadas funcionalidades nuevas.

Busca específicamente:

comentarios sin workspace_id
IDOR (Luis lee comments o notifications de Ana)
403 en vez de 404
@menciones que no son miembros del workspace
auto-mención
Resend, SMTP, Socket.IO, Redis, React Router, RHF, tercer servicio Docker
email enviado antes de persistir el comentario
SSE de comentarios como API de escritura
eco que tostea al autor del comentario
campana que lista notificaciones de otro usuario
campana de Luis vacía tras `@Luis` (no insertó mention, GET vacío, o el popover no pinta GET)
GET 200 con filas y popover “No se pudieron cargar las menciones” (parse Zod del cliente, p. ej. datetime ISO)
“Nada pendiente” en isError como si el inbox estuviera vacío
Ana GET 200 `[]` pintada como fallo de carga en vez de “No hay menciones.”
GET /api/notifications 500 porque Zod rechaza `toISOString()` o un preview vacío
toast de tablero / comment.created tratado como si fuera la campana
comentario que se crea al Guardar la tarea en vez de POST /comments
outbox commiteado o fuera de `./data`
incumplimientos de `AGENTS.md`

Si se detectan problemas, dame únicamente los reales, su severidad y el plan mínimo. No modifiques código hasta que aprobemos el plan.
