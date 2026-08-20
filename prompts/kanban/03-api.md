Revisa el estado actual del repo antes de proponer cambios.

Estamos construyendo el Kanban de la Sesión 2.

Implementa la API mínima necesaria para:

- obtener el board con sus columnas y tareas
- crear tareas
- editar título y descripción
- eliminar tareas

Requisitos:

Valida input y response con Zod en `@agentic-kanban/schemas`.
Sesión → 401. No miembro o recurso inexistente → 404 (nunca 403).
Comprueba `workspace_member`.
Verifica que project, column y task pertenecen al workspace autorizado.
No confíes en `workspaceId`, `projectId`, `columnId` o `taskId` enviados por el cliente como prueba de autorización.
`workspace_id` sale de la fila, no del cliente.
Datos solo vía `@agentic-kanban/db`.
Evita cualquier posible IDOR.
No implementes todavía drag and drop.
No implementes realtime.
No cambies el frontend todavía.

Plan primero: endpoints, schemas Zod, flujo de autorización, archivos.
Luego implementa. Actualiza `AGENTS.md`: board HTTP sí; move/DnD no.

Verificación: `vp check --no-fmt`; tests 401 / 404 + CRUD de task.
