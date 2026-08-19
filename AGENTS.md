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

Better Auth (email + password) is wired: registration, login, cookie session,
and logout work end-to-end. The health path still proves the stack:

```text
React → TanStack Query → fetch("/api/health") → Vite+ proxy
  → Hono (Bun) → Drizzle → @libsql/client → local libSQL file
```

Auth flow:

```text
React (signUp.email / signIn.email / useSession)
  → fetch relative /api/auth/* (no baseURL, no CORS)
  → Vite+ proxy → Hono → auth.handler (Better Auth)
  → drizzleAdapter(sqlite) → @libsql/client → libSQL file
```

Tenant tables exist in Drizzle (`workspace`, `workspace_member`, `project`).
Read-only HTTP for a signed-in user:

```text
GET /api/workspaces
  → auth.api.getSession(headers) (401 if missing)
  → listWorkspacesForUser(session.user.id) via workspace_member
GET /api/projects/:projectId
  → session (401)
  → getProjectForMember(projectId, userId)
    (join on the row's workspace_id + membership; 404 if missing/not a member)
```

No workspace/project HTTP writes or board CRUD. Classroom seed:

```text
bun run db:seed
  → auth.api.signUpEmail (Ana, Luis) or reuse user.id by email
  → upsert workspace ws_thepower_demo, project proj_agentic_kanban,
    workspace_member for both
  → upsert ws_ana_demo + proj_ana_notes, member Ana only
    Idempotent. Never mass DELETE.
```

After login the dashboard lists `GET /api/workspaces` (TanStack Query +
the same Zod schema). Swatch color is a function of `workspace.id`, never
of the signed-in user. Ana sees two workspaces; Luis sees the shared one.

The API does **not** seed on boot. After deleting `data/*.db*`: `db:migrate` then `db:seed`. Never run the Mac API (or seed) while Compose uses the same `.db`.

**Not implemented yet (do not invent):** workspace/project HTTP writes,
columns, tasks, Kanban board, drag-and-drop, realtime, comments, mentions,
email, deploy, session git tags.

Finished product (later, still small): one demo workspace, one board, three
columns, cards, two demo users, comments, `@mentions`, realtime in the Hono
process, notification toast/bell.

**Out of scope forever:** billing, RBAC, attachments, mobile, SSO, automations,
microservices, queues, extra cloud.

## Responsibility split

Never conflate these:

| Layer                                | Owner                     | Role                                |
| ------------------------------------ | ------------------------- | ----------------------------------- |
| TypeScript                           | `tsc` / Vite+ typecheck   | static types                        |
| Zod                                  | `@agentic-kanban/schemas` | runtime input / response validation |
| Better Auth                          | `apps/api/src/auth/`      | authentication                      |
| Membership checks                    | API                       | authorization (404 if not a member) |
| `workspace_id` on every tenant query | API + Drizzle             | tenant isolation                    |

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

**Bun 1.3.14** is the API runtime **and** the package manager
(`packageManager: bun@1.3.14`). Do not run the API on Node. Do not add
`@hono/node-server`, Express, Fastify, Nest, `tsx`, `ts-node`.

**Vite+ 0.2.9** owns the frontend toolchain (not standalone Vite / ESLint /
Prettier / a second Vitest). Import config from `vite-plus`
(`defineConfig`, `lazyPlugins`). Tests import from `vite-plus/test`.

Overrides (required):

```text
vite   → npm:@voidzero-dev/vite-plus-core@0.2.9
vitest → 4.1.10
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
| TanStack Query 5.101.4                                                   | One `QueryClient`. Health + `GET /api/workspaces` after login.                                    |
| better-auth 1.7.1                                                        | React client (`createAuthClient`, `useSession`). No `baseURL`; fetch is relative `/api/auth/*`.   |
| Zod 4.4.3                                                                | Runtime-parse API JSON with `@agentic-kanban/schemas`. Client-side sign-up/sign-in validation.    |
| `@dnd-kit/react` 0.5.0                                                   | Installed only. Do **not** add `@dnd-kit/core` / `sortable` as the API. Do not implement DnD yet. |

`vp dev apps/web` / `vp build apps/web`. Dev server `0.0.0.0:5173`.

## Backend (`apps/api`)

| Dep                         | Why                                                                       |
| --------------------------- | ------------------------------------------------------------------------- |
| Hono 4.13.3                 | HTTP. Bun-native `export default { port, hostname: "0.0.0.0", fetch }`.   |
| `@hono/zod-validator` 0.9.0 | Query/param on workspace + project GET; responses via schema.parse.   |
| Zod 4.4.3                   | Same major as schemas.                                                    |
| Better Auth 1.7.1           | `betterAuth` with `drizzleAdapter` + `provider: "sqlite"` on this libSQL. |
| `@agentic-kanban/db`        | Only database access (reads + seed upserts). Never drizzle from the API.  |
| `@agentic-kanban/schemas`   | Shared response / param shapes (auth forms + workspace/project GET).      |

`src/auth/index.ts` exports the `auth` instance (Better Auth + drizzleAdapter).
`src/routes/auth.ts` mounts `/api/auth/*` via `auth.handler`. `src/middleware/
rate-limit.ts` is an in-memory rate limiter for POST sign-up / sign-in only
(not get-session). `src/middleware/session.ts` requires a session (`401`).
`src/routes/workspaces.ts` and `src/routes/projects.ts` are GET-only.
Membership: not a member or missing row → `404` (never `403`). The client
does not authorize: `workspace_id` comes from the project row. Seed lives in
`src/seed.ts` (`bun run db:seed`); it is not imported by the server.
`src/realtime/index.ts` stays a placeholder. Realtime must stay inside this
process (SSE or WebSocket). No Socket.IO, Redis, extra service.

Listen `0.0.0.0:${API_PORT:-3000}`. Hot reload: `bun run --hot`.

## Database (`packages/db`)

Local file only. No Postgres, Prisma, Turso Cloud, `@tursodatabase/database`,
`better-sqlite3`, `pg`.

```text
Hono → drizzle-orm/libsql → @libsql/client → file:…/agentic-kanban.db
```

| Dep                   | Why                                                  |
| --------------------- | ---------------------------------------------------- |
| drizzle-orm 0.45.2    | Stay on 0.45. Do not jump to 1.0 RC.                 |
| drizzle-kit 0.31.10   | `db:generate` / `db:migrate`. Never auto-run.        |
| @libsql/client 0.17.4 | File driver.                                         |

`getDb()` / proxied `db` open **lazily** so Docker volumes exist before the
first query. `pingDatabase()` is `SELECT 1` (retry once after a stale handle).

Host default: `file:<repo>/data/agentic-kanban.db`.
Compose: `DATABASE_URL=file:/data/agentic-kanban.db` bind-mounted from `./data`.
Never commit `*.db`. `docker compose down` keeps `./data`; delete `data/*.db*`
to reset. After deleting the DB, run `bun run db:migrate` (alias `db:m`) then
`bun run db:seed`.

Schema folder:

- Better Auth: `user`, `session`, `account`, `verification` in `schema/auth.ts`.
- Tenant: `workspace`, `workspace_member` in `schema/workspace.ts`;
  `project` in `schema/project.ts`. Reads: `listWorkspacesForUser`,
  `getProjectForMember`. No board CRUD. `workspace_member` is unique on
  `(workspace_id, user_id)` and FKs `user.id`. No `role`, slug, owner, columns,
  or tasks. Indexes: `project.workspace_id`, `workspace_member.user_id`.

Use `sqliteTable` / `text` / `integer` from `drizzle-orm/sqlite-core`. Tenant
reads go through `listWorkspacesForUser` / `getProjectForMember` (membership +
the row's `workspace_id`). Seed upserts workspace/project/member by id (no mass
DELETE). No board CRUD. Never run the Mac API and Compose against the same `.db`.

Migrations: `bun run db:generate` then `bun run db:migrate` (once). After
deleting `data/*.db*`, run `db:migrate` again. Never auto-run migrations.

## Docker

Two services only: `web`, `api`. No database container.

- API image: `oven/bun:1.3.14`.
- Web image: also `oven/bun:1.3.14` + workspace `vite-plus@0.2.9`. Official
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
bun run db:migrate          # or: bun run db:m
bun run db:seed             # stop Compose API first; same .db as migrate
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
