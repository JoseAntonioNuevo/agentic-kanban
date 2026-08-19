# Tecnologías backend

API en `apps/api`: **Hono sobre Bun**. Un proceso, un puerto, cero CORS. Hoy solo vive `GET /api/health`.

```mermaid
flowchart TB
  bun["Bun 1.3.14 — 0.0.0.0:3000"]
  hono["Hono 4.13.3"]
  health["GET /api/health"]
  ping["pingDatabase"]
  zod["healthResponseSchema.parse"]

  bun --> hono
  hono --> health
  health --> ping
  ping --> zod
  zod --> json["JSON 200 o 503"]
```

- Runtime = Bun. No Node, no `@hono/node-server`, no Express.
- Cada fichero de rutas es un `new Hono()` y se cuelga con `app.route("/", …)`.
- Validación con `@agentic-kanban/schemas`. Datos **solo** vía `@agentic-kanban/db` (la API no importa Drizzle ni `@libsql/client`).
- Placeholders: `src/auth/` y `src/realtime/`. El realtime futuro se queda **dentro** de este proceso (SSE o WebSocket).
- Hot reload: `bun run --hot`.

```mermaid
flowchart LR
  subgraph hoy [Hoy]
    H["health.ts"]
  end
  subgraph luego [Sesiones posteriores]
    A["auth/"]
    R["realtime/"]
  end
  subgraph nunca [Nunca]
    X["Express Fastify Nest"]
    Y["Socket.IO Redis"]
    Z["CORS"]
  end
  App["src/index.ts"] --> H
  App -.-> A
  App -.-> R
```

> [!tip] Regla de oro
> Sin CORS: el navegador no llama a `:3000`. Llama a `/api` en `:5173` y Vite+ hace de puente.

| Hoy | Instalado, aún no se usa | Nunca |
| --- | --- | --- |
| Hono + Bun, `GET /api/health` | Better Auth, `@hono/zod-validator` (CRUD) | Express, Nest, Node server, Socket.IO, Redis |

← [Frontend](02-tecnologias-frontend.md) · [Base de datos →](04-base-de-datos.md)
