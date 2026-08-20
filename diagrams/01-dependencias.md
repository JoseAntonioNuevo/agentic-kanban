# Dependencias del proyecto

Un monorepo Bun: el root agrupa cuatro paquetes; las flechas internas son `workspace:*`, las externas van **pin exacto** (sin `^`).

```mermaid
flowchart TB
  root["agentic-kanban"]
  web["apps/web — @agentic-kanban/web"]
  api["apps/api — @agentic-kanban/api"]
  db["packages/db — @agentic-kanban/db"]
  schemas["packages/schemas — @agentic-kanban/schemas"]

  root --> web
  root --> api
  root --> db
  root --> schemas
  web --> schemas
  api --> schemas
  api --> db
```

- Workspaces: `apps/*` + `packages/*`. Gestor y runtime de la API: **Bun 1.4.0**.
- Interno: `"@agentic-kanban/schemas": "workspace:*"` (nunca una versión publicada).
- Externo: pin exacto (`"hono": "4.13.3"`). Un solo `bun.lock` en la raíz.
- `web` **no** importa `db`. El navegador no habla con libSQL.

```mermaid
flowchart LR
  subgraph bien [Correcto]
    pin["hono: 4.13.3"]
    ws["db: workspace:*"]
  end
  subgraph mal [Incorrecto]
    caret["hono: ^4.13.3"]
    npm["schemas: 1.0.0"]
  end
```

> [!tip] Regla de oro
> Interno = `workspace:*`. Terceros = número cerrado. El navegador nunca importa `@agentic-kanban/db`.

| Hoy                                   | Instalado, aún no se usa | Nunca                                     |
| ------------------------------------- | ------------------------ | ----------------------------------------- |
| 4 paquetes, `workspace:*`, `bun.lock` | —                        | Turborepo, Nx, Lerna, `package-lock.json` |

← [Índice](README.md) · [Frontend →](02-tecnologias-frontend.md)
