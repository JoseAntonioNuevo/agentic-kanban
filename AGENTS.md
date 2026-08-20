# Agentic Kanban

Starter for **thePower — Desarrollo Agéntico** (José Antonio Nuevo).
Trello-like multi-tenant Kanban SaaS. Four live sessions. Separate from any
LangGraph / LangSmith project.

This file is the agent contract. Prefer it over inventing stack or product
scope. The tree is the source of truth for files.

## OpenViking

**This repo does not use OpenViking.** Ignore parent/user OV policy, the
`openviking` MCP, `viking://`, `ov_*` / `ov-write-safe`, and session notes.
Do not fail closed for a missing `hermes` account. Git and this file are
enough.

## Current state

Skeleton only. Proves this path works:

```text
React → TanStack Query → fetch("/api/health") → Vite+ proxy
  → Hono (Bun) → Drizzle → @libsql/client → local libSQL file
```

**Not implemented yet (do not invent):** product tables, Better Auth wiring,
login/register, demo users, workspace/project/task CRUD, Kanban board,
drag-and-drop, realtime, comments, mentions, email, deploy, session git tags.

Finished product (later, still small): one demo workspace, one board, three
columns, cards, two demo users, comments, `@mentions`, realtime in the Hono
process, notification toast/bell.

**Out of scope forever:** billing, RBAC, attachments, mobile, SSO, automations,
microservices, queues, extra cloud.

## Responsibility split

Never conflate these:

| Layer                                | Owner                        | Role                                |
| ------------------------------------ | ---------------------------- | ----------------------------------- |
| TypeScript                           | `tsc` / Vite+ typecheck      | static types                        |
| Zod                                  | `@agentic-kanban/schemas`    | runtime input / response validation |
| Better Auth                          | `apps/api/src/auth/` (later) | authentication                      |
| Membership checks                    | API (later)                  | authorization                       |
| `workspace_id` on every tenant query | API + Drizzle (later)        | tenant isolation                    |

The browser must never decide tenant authorization.

Server state → TanStack Query. Local UI state → React state. No Redux/Zustand.

## Workspaces

Bun workspaces (`apps/*`, `packages/*`). Internal deps: `workspace:*`.

| Package | Name                      | Job                            |
| ------- | ------------------------- | ------------------------------ |
| web     | `@agentic-kanban/web`     | React SPA                      |
| api     | `@agentic-kanban/api`     | Hono on Bun                    |
| db      | `@agentic-kanban/db`      | single libSQL + Drizzle client |
| schemas | `@agentic-kanban/schemas` | shared Zod (web + api)         |

Do not add Turborepo, Nx, Lerna, or extra architecture packages.

## How a health request travels

1. `apps/web` mounts one `QueryClient` in `main.tsx`.
2. `useHealth()` `fetch("/api/health")` — relative URL only, never `localhost:3000`.
3. Vite+ proxies `/api` → `API_PROXY_TARGET` (`http://localhost:3000` on host,
   `http://api:3000` in Compose). No CORS.
4. Hono `GET /api/health` imports `healthResponseSchema` from schemas and
   `pingDatabase()` from db.
5. Drizzle runs `SELECT 1` through `@libsql/client`.
6. Web **parses** the JSON with the same Zod schema (no type casts).

## Runtime and toolchain

**Bun 1.4.0** is the API runtime **and** the package manager
(`packageManager: bun@1.4.0`). Do not run the API on Node. Do not add
`@hono/node-server`, Express, Fastify, Nest, `tsx`, `ts-node`.

**Vite+ 0.2.9** owns the frontend toolchain (not standalone Vite / ESLint /
Prettier / a second Vitest). Import config from `vite-plus`
(`defineConfig`, `lazyPlugins`). Tests import from `vite-plus/test`.

Overrides (required):

```text
vite      → npm:@voidzero-dev/vite-plus-core@0.2.9
vitest    → 4.1.10
bun-types → 1.4.0
```

Bundled: Vite 8.2.1, Vitest 4.1.10, Rolldown 1.2.3, Oxlint 1.77.0, Oxfmt 0.62.0.

**TypeScript 7.0.2.** Strict. TS 7 removed `baseUrl`; web `paths` (`@/*` →
`./src/*`) live without it. Vite alias `@` → `apps/web/src`. Do not leak Bun
types into `apps/web` (`types: ["vite/client"]` there; `@types/bun` only on api/db).

Exact-pin every third-party direct dependency. No `^` `~` `*`. Commit `bun.lock`
only.

## Frontend (`apps/web`)

| Dep                                                                      | Why                                                                                               |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| React 19.2.8                                                             | SPA. No Next, Astro, React Router (until routing is real).                                        |
| Vite+ + `@vitejs/plugin-react` 6.0.5                                     | Dev/build. Import plugins via `vite-plus`.                                                        |
| Tailwind 4.3.3 + `@tailwindcss/vite`                                     | CSS via Vite plugin. `@import "tailwindcss"` — no v3 config.                                      |
| shadcn 4.18.0                                                            | Pinned CLI. Components in `src/components/ui`. No `form` (no RHF).                                |
| radix-ui, cva, clsx, tailwind-merge, lucide-react, tw-animate-css, geist | Pulled in by shadcn. Keep exact pins.                                                             |
| sonner + next-themes                                                     | Toasts. `next-themes` is **not** Next.js.                                                         |
| TanStack Query 5.101.4                                                   | One `QueryClient`. Fetches `/api/health` today.                                                   |
| better-auth 1.7.1                                                        | Installed only. Official React client later (`createAuthClient`, `useSession`).                   |
| Zod 4.4.3                                                                | Runtime-parse API JSON with `@agentic-kanban/schemas`.                                            |
| `@dnd-kit/react` 0.5.0                                                   | Installed only. Do **not** add `@dnd-kit/core` / `sortable` as the API. Do not implement DnD yet. |

`vp dev apps/web` / `vp build apps/web`. Dev server `0.0.0.0:5173`.

## Backend (`apps/api`)

| Dep                         | Why                                                                             |
| --------------------------- | ------------------------------------------------------------------------------- |
| Hono 4.13.3                 | HTTP. Bun-native `export default { port, hostname: "0.0.0.0", fetch }`.         |
| `@hono/zod-validator` 0.9.0 | Request validation (unused until CRUD).                                         |
| Zod 4.4.3                   | Same major as schemas.                                                          |
| Better Auth 1.7.1           | Installed only. Future: `drizzleAdapter` + `provider: "sqlite"` on this libSQL. |
| `@agentic-kanban/db`        | Only database access.                                                           |
| `@agentic-kanban/schemas`   | Shared response / (later) input shapes.                                         |

Placeholders: `src/auth/index.ts`, `src/realtime/index.ts`. Realtime must stay
inside this process (SSE or WebSocket). No Socket.IO, Redis, extra service.

Listen `0.0.0.0:${API_PORT:-3000}`. Hot reload: `bun run --hot`.

## Database (`packages/db`)

Local file only. No Postgres, Prisma, Turso Cloud, `@tursodatabase/database`,
`better-sqlite3`, `pg`.

```text
Hono → drizzle-orm/libsql → @libsql/client → file:…/agentic-kanban.db
```

| Dep                   | Why                                                                      |
| --------------------- | ------------------------------------------------------------------------ |
| drizzle-orm 0.45.2    | Stay on 0.45. Do not jump to 1.0 RC.                                     |
| drizzle-kit 0.31.10   | `db:generate` / `db:migrate` exist; do not auto-run (no product schema). |
| @libsql/client 0.17.4 | File driver.                                                             |

`getDb()` / proxied `db` open **lazily** so Docker volumes exist before the
first query. `pingDatabase()` is `SELECT 1` (retry once after a stale handle).

Host default: `file:<repo>/data/agentic-kanban.db`.
Compose: `DATABASE_URL=file:/data/agentic-kanban.db` bind-mounted from `./data`.
Never commit `*.db`. `docker compose down` keeps `./data`; delete `data/*.db*` to reset.

Schema folder is empty on purpose. Use `sqliteTable` / `text` / `integer` from
`drizzle-orm/sqlite-core` when Session 1 adds tables. Every tenant-owned query
must be scoped by an authorized `workspace_id`.

## Docker

Two services only: `web`, `api`. No database container.

- API image: `oven/bun:1.4.0`.
- Web image: also `oven/bun:1.4.0` + workspace `vite-plus@0.2.9`. Official
  `ghcr.io/voidzero-dev/vite-plus:0.2.9` denies unauthenticated pulls.
- Bind-mount source; anonymous `/app/node_modules` so the host does not
  overwrite Linux deps.
- DB is **`./data` → `/data`**, not `/app/data`. A volume under the source
  mount plus `bun --hot` caused `SQLITE_READONLY_DBMOVED`.

Classroom command: `docker compose up --build`. Students should not need a
local Bun/Node/Turso account. If host 3000 is taken: `API_HOST_PORT=3002`.

## Commands

```bash
bun install                 # or: bun install --frozen-lockfile
vp check                    # fmt + lint + typecheck (must stay green)
vp test
vp build apps/web
vp toolchain --json
bun --filter @agentic-kanban/api dev
vp dev apps/web
docker compose up --build
```

## Do not add

Next.js, Astro, Express, Fastify, Nest, `@hono/node-server`, Supabase,
Postgres, Turso Cloud, Prisma, `@tursodatabase/database`, Redux, Zustand,
React Router, tRPC, Socket.IO, React Hook Form, ESLint, Prettier, dotenv,
Resend, Turborepo, Nx, Redis, queues.

Layer how-tos live in `.cursor/rules/`. Keep them thin and file-scoped. Do not
add more unless asked. Do not create `sesion-*` tags.

Pin versions after any shadcn add (`shadcn@4.18.0`, never `@latest`).
