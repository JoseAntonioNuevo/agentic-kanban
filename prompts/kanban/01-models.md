Revisa el estado actual del repo antes de proponer cambios.

Estamos construyendo el Kanban de la Sesión 2.

Añade el modelo de datos mínimo para:

- column
- task

Requisitos:

column pertenece a project y workspace.
task pertenece a column, project y workspace.
Ambas deben permitir mantener un orden mediante `position`.
Mantén todas las reglas de aislamiento multi-tenant existentes.
Usa Drizzle.
Genera una migración nueva. No modifiques migraciones anteriores.
No añadas funcionalidades que no necesitamos.
No implementes todavía API ni frontend.

Plan primero: schema, relaciones, índices y constraints.
Luego implementa. Actualiza `AGENTS.md`: tablas sí; HTTP no.

Verificación: `vp check --no-fmt`; el SQL nuevo está en `packages/db/migrations/`.
