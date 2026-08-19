# Cómo se interconecta el monorepo

Misma petición, cuatro paquetes. El navegador pide `/api/health`; Vite+ reenvía; Hono pingea el `.db`; **el mismo Zod** valida el JSON en API y otra vez en web.

```mermaid
sequenceDiagram
  participant Nav as Navegador
  participant Vite as Vite_5173
  participant Hono as Hono_Bun_3000
  participant Zod as packages_schemas
  participant Drizzle as packages_db
  participant File as agentic_kanban_db
  Nav->>Vite: GET /api/health
  Vite->>Hono: proxy API_PROXY_TARGET
  Hono->>Drizzle: pingDatabase
  Drizzle->>File: SELECT 1
  File-->>Drizzle: ok
  Hono->>Zod: healthResponseSchema.parse
  Hono-->>Vite: JSON
  Vite-->>Nav: JSON
  Nav->>Zod: el mismo schema.parse
```

```mermaid
flowchart TB
  subgraph apps [apps se ejecutan]
    web["web :5173"]
    api["api :3000"]
  end
  subgraph pkgs [packages se importan]
    schemas["schemas"]
    db["db"]
  end
  web --> schemas
  api --> schemas
  api --> db
```

Compose: **dos** servicios. El `.db` es un bind-mount, no un tercer contenedor.

```mermaid
flowchart LR
  browser["Navegador"] --> web["web :5173"]
  web -->|"proxy /api"| api["api :3000"]
  api --> volume["./data a /data"]
```

> [!tip] Regla de oro — capas (no las mezcles)
> TypeScript tipa · Zod valida · Better Auth autentica *(luego)* · la API autoriza *(luego)* · `workspace_id` aísla *(luego)*. Detalle en [Capas](06-capas.md). **El navegador nunca decide autorización.**

| Hoy | Instalado, aún no se usa | Nunca |
| --- | --- | --- |
| Health de punta a punta, 2 contenedores | Auth, workspaces, tablero | Microservicios, cola, Redis, contenedor de DB |

← [Base de datos](04-base-de-datos.md) · [Capas →](06-capas.md)
