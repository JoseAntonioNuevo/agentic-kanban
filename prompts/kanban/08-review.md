Lee `AGENTS.md` y revisa toda la implementación actual de la Sesión 2 como si estuvieras haciendo una revisión de PR.

No añadas funcionalidades nuevas.

Busca específicamente:

queries tenant-owned sin `workspace_id`
posibles IDOR
acceso a tasks o columns de otro workspace
movimientos entre projects
403 en vez de 404
inputs sin validación Zod
inconsistencias en `position`
duplicación del server state fuera de TanStack Query
uso incorrecto o legacy de dnd-kit
optimistic updates incorrectos
rollback incompleto
problemas de seed/idempotencia
regresiones de autenticación o multi-tenancy de la Sesión 1
dependencias innecesarias
código o abstracciones innecesariamente complejas
incumplimientos de `AGENTS.md`

Si se detectan problemas, dame únicamente los reales, su severidad y el plan mínimo. No modifiques código hasta que aprobemos el plan.
