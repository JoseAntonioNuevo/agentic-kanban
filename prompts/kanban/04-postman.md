# Sesión 2 · 04 — Colección de Postman

Tiempo en clase: ~5 min. Antes de crear nada, presenta un plan de 10 líneas
como máximo y espera mi «adelante».

## Punto de partida

La API del tablero (03) funciona y tiene tests. Queremos ver el contrato HTTP
desde fuera antes de construir la interfaz. No cambies la API salvo que
encuentres un bug real; si lo encuentras, dímelo antes de tocarla.

## Objetivo

Una colección y un entorno de Postman listos para importar:

```text
postman/
├── agentic-kanban-session2.postman_collection.json
└── agentic-kanban-local.postman_environment.json
```

## Requisitos

- Formato Postman Collection v2.1. Rutas copiadas del código real (lee
  `apps/api/src/routes/`), nunca inventadas.
- Variables: `baseUrl` (por defecto `http://localhost:3000`, cambiable a
  `http://localhost:3002` o a `http://localhost:5173`), `origin`
  (`http://localhost:5173`), `workspaceId`, `projectId`, `columnId` y `taskId`.
- Autenticación real de Better Auth: cookies de sesión, nunca tokens Bearer.
  Todas las peticiones a `/api/auth/*` llevan la cabecera `Origin: {{origin}}`:
  Better Auth rechaza con 403 las que ya llevan cookie y no traen un origen de
  confianza (pasa al repetir el login).
- Scripts que guardan `workspaceId`, `projectId`, `columnId` y `taskId` a
  partir de las respuestas. Nada de IDs fijos salvo `proj_ana_notes`, que es el
  fixture de aislamiento del seed.
- Carpetas y peticiones:
  - `01 - Auth`: login de Ana (`ana@demo.test` / `Demo1234!`).
  - `02 - Workspaces`: listar workspaces.
  - `03 - Board`: obtener el tablero.
  - `04 - Tasks`: crear, editar y borrar una tarea.
  - `05 - Security & Validation`: payload inválido (400), petición sin sesión
    (401) y Luis pidiendo el tablero de `proj_ana_notes` (404). Como la
    cookie se comparte, este bloque hace login de Luis y termina volviendo a
    Ana.
- Tests simples en cada petición importante: código esperado, JSON válido e
  IDs presentes. Para acceso no autorizado, 404 y nunca 403.
- Flujo principal en orden: Login Ana → Get Workspaces → Get Board → Create
  Task → Update Task → Delete Task.

## Fuera de alcance

Cambios de funcionalidad en la API, Newman y paquetes nuevos.

## Cómo trabajar

Encárgalo a un `kanban-implementer` (Sonnet, de `.claude/agents/`). Después,
`kanban-verifier` (Haiku) comprueba que los dos JSON se parsean, que cada URL
existe en `apps/api/src/routes/` y reproduce el flujo principal y el bloque 05
con `curl` contra `http://localhost:3000`.

## Hecho cuando

- [ ] Los dos ficheros son JSON válido y Postman los importa.
- [ ] Las URLs y los bodies coinciden con las rutas y los schemas Zod reales.
- [ ] El flujo reproducido con `curl` devuelve 200, 200, 200, 201, 200 y 204,
      y el bloque 05 devuelve 400, 401 y 404.

## Al terminar

Actualiza `AGENTS.md` (la colección existe y cómo usarla). No hagas commit.
Cierra con el resumen que pide `AGENTS.md`.
