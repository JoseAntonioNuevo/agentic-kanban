Revisa la autenticación, autorización y aislamiento multi-tenant implementados previamente.

Implementa la API mínima necesaria para:

- obtener el board con sus columnas y tareas
- crear tareas
- editar título y descripción
- eliminar tareas

Requisitos:

Usa Zod para validar inputs.
Todas las rutas protegidas requieren sesión.
Comprueba workspace_member.
Verifica que project, column y task pertenecen al workspace autorizado.
No confíes en workspaceId, projectId, columnId o taskId enviados por el cliente como prueba de autorización.
Evita cualquier posible IDOR.
Mantén las queries tenant-owned correctamente aisladas por workspace_id.
Usa los patrones existentes del repo.
No implementes todavía drag and drop.
No implementes realtime.
No cambies el frontend todavía.

Primero inspecciona el código y propón los endpoints mínimos, sus schemas Zod y el flujo de autorización.
