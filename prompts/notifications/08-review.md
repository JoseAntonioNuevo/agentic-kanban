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
outbox commiteado o fuera de `./data`
incumplimientos de `AGENTS.md`

Si se detectan problemas, dame únicamente los reales, su severidad y el plan mínimo. No modifiques código hasta que aprobemos el plan.
