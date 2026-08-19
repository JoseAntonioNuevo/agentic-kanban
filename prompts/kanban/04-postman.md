revisa la API del Kanban que acabamos de implementar.

No cambies la funcionalidad de la API salvo que detectes un bug real.

Prepara una colección de Postman lista para importar y probar manualmente todos los endpoints actuales del Kanban.

Crea:

```text
postman/
├── agentic-kanban-session2.postman_collection.json
└── agentic-kanban-local.postman_environment.json
```

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

Configura variables de Postman para evitar IDs hardcodeados:

```text
baseUrl
workspaceId
projectId
columnId
taskId
```

Usa por defecto:

```text
baseUrl = http://localhost:3000
```

pero debe poder cambiarse fácilmente a `http://localhost:3002` u otro puerto desde el environment.

Cuando sea posible, añade scripts de Postman que extraigan automáticamente de las respuestas:

- `workspaceId`
- `projectId`
- `columnId`
- `taskId`

y los guarden como variables para los siguientes requests.

La autenticación debe funcionar usando el mecanismo real de Better Auth implementado en el proyecto. Aprovecha correctamente el manejo de cookies de Postman y no inventes tokens Bearer si la aplicación usa sesión por cookie.

Organiza la colección en carpetas claras, por ejemplo:

```text
01 - Auth
02 - Workspaces
03 - Board
04 - Tasks
05 - Security & Validation
```

Añade tests simples de Postman en los requests importantes para comprobar:

- status code esperado
- respuesta JSON válida
- IDs esperados presentes
- 400 para validación incorrecta
- 401 para usuario no autenticado
- 403/404 para acceso no autorizado según la política real de nuestra API

El flujo principal de la colección debe poder ejecutarse aproximadamente así:

```text
Login Ana
→ Get Workspaces
→ Get Board
→ Create Task
→ Update Task
→ Delete Task
```

No hardcodees IDs del seed si puedes obtenerlos de respuestas anteriores.

Antes de terminar:

1. valida que ambos JSON sean JSON válido;
2. verifica que Postman pueda importarlos;
3. revisa que las URLs coincidan exactamente con las rutas implementadas;
4. comprueba que los request bodies coincidan con los schemas Zod reales;
5. comprueba que el flujo de autenticación coincida con Better Auth;
6. no modifiques la API simplemente para hacer más fácil la colección.

Primero revisa los endpoints actuales y dime qué requests incluirás, qué variables guardarás automáticamente y cómo manejarás la sesión de Better Auth.

No toques nada de codigo a no ser que detectes un bug y genera los json para importar directamente a postman y poder probar la implementacion.
