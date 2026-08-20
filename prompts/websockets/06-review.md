Lee `AGENTS.md` y revisa toda la implementación actual de la Sesión 3 como si estuvieras haciendo una revisión de PR.

No añadas funcionalidades nuevas.

Busca específicamente:

escrituras por HTTP; el stream solo anuncia
Socket.IO, Redis o servicio extra
stream sin sesión (debe 401)
suscripción sin membership (debe 404, nunca 403)
Luis GET eventos de `proj_ana_notes` → 404
eventos emitidos si el write falló
segundo board en `useState`
eco que rompe el optimistic de Ana
toasts al actor
inputs/eventos sin Zod
presencia, notificaciones persistidas, comentarios
incumplimientos de `AGENTS.md`

Si se detectan problemas, dame únicamente los problemas reales encontrados, su severidad y el plan mínimo para corregirlos. No modifiques código hasta que aprobemos el plan.
