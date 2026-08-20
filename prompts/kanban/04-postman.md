Revisa el estado actual del repo antes de proponer cambios.

Estamos construyendo el Kanban de la Sesión 2.

Prepara una colección de Postman lista para importar y probar manualmente todos los endpoints actuales del Kanban. No cambies la funcionalidad de la API salvo que detectes un bug real.

Crea:

```text
postman/
├── agentic-kanban-session2.postman_collection.json
└── agentic-kanban-local.postman_environment.json
```

Requisitos:

La colección debe usar las rutas reales existentes en el código, no inventar endpoints.

Incluye como mínimo requests para:

- login con `ana@demo.test / Demo1234!`
- obtener los workspaces del usuario
- obtener el board con columnas y tareas
- crear una tarea
- editar una tarea
- eliminar una tarea
- comprobar un payload inválido
- comprobar acceso sin autenticar
- comprobar acceso a un workspace/recurso no autorizado

Variables de Postman (sin IDs hardcodeados):

```text
baseUrl
workspaceId
projectId
columnId
taskId
```

Por defecto `baseUrl = http://localhost:3000`; debe poder cambiarse a `http://localhost:3002` u otro puerto desde el environment.

Cuando sea posible, scripts que extraigan de las respuestas `workspaceId`, `projectId`, `columnId`, `taskId` y los guarden para los siguientes requests.

La autenticación usa el mecanismo real de Better Auth: cookies de sesión, no tokens Bearer inventados.

Carpetas:

```text
01 - Auth
02 - Workspaces
03 - Board
04 - Tasks
05 - Security & Validation
```

Tests simples en los requests importantes:

- status code esperado
- respuesta JSON válida
- IDs esperados presentes
- 400 para validación incorrecta
- 401 para usuario no autenticado
- 404 (nunca 403) para acceso no autorizado

Flujo principal:

```text
Login Ana
→ Get Workspaces
→ Get Board
→ Create Task
→ Update Task
→ Delete Task
```

No hardcodees IDs del seed si puedes obtenerlos de respuestas anteriores.

Plan primero: qué requests incluirás, qué variables guardarás automáticamente y cómo manejarás la sesión de Better Auth.
Luego genera los JSON. Actualiza `AGENTS.md`: colección Postman sí; no cambies la API para facilitar la colección.

Verificación: ambos JSON son JSON válido; Postman puede importarlos; las URLs coinciden con las rutas implementadas; los bodies coinciden con los schemas Zod; la sesión es cookie de Better Auth. No toques código salvo un bug real.
