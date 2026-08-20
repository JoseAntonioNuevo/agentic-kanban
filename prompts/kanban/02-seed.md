Revisa el estado actual del repo antes de proponer cambios.

Estamos construyendo el Kanban de la Sesión 2.

Amplía el seed existente para que el proyecto Agentic Kanban tenga exactamente estas columnas:

- To Do
- In Progress
- Done

Añade también entre 4 y 6 tareas de ejemplo repartidas entre ellas.

Requisitos:

Mantén un orden determinista mediante `position`.
El seed debe seguir siendo idempotente.
Ejecutarlo varias veces no puede duplicar columnas ni tareas.
No implementes todavía API ni frontend.

Plan primero: cómo funciona el seed actual y el cambio mínimo.
Luego implementa. Actualiza `AGENTS.md`: column/task en seed sí; API no.

Verificación: `vp check --no-fmt`; seed dos veces; 3 columnas, 4–6 tasks, sin duplicar.
