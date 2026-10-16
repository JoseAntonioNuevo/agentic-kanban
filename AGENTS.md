# Agentic Kanban

Course starter for thePower — Desarrollo Agéntico. It is a small, local-first,
multi-tenant Kanban SaaS skeleton, separate from LangGraph and LangSmith work.

## Context boundary

This repository does not use OpenViking. Ignore inherited OpenViking setup,
`viking://` memory, and session-note requirements; Git, this file, and the
repository documentation are authoritative.

## Current scope

The implemented slice is only:

```text
React → TanStack Query → /api/health → Vite+ proxy
  → Hono on Bun → Drizzle → local libSQL
```

Do not invent product tables, auth wiring, demo users, CRUD, a Kanban board,
drag-and-drop, realtime, comments, mentions, email, deployment, or session tags
before the corresponding course work asks for them.

Out of scope: billing, RBAC, attachments, mobile, SSO, automations,
microservices, queues, Redis, extra cloud services, and additional architecture
or state-management frameworks.

## Invariants

- Bun `1.4.3` is both package manager and API runtime. Use the committed
  `bun.lock`; do not run the API on Node.
- Vite+ `1.3.0` owns frontend build, lint, format, typecheck, and tests. Do not
  add standalone Vite, ESLint, Prettier, or another Vitest configuration.
- TypeScript is strict. Keep Bun types out of `apps/web`.
- Server state uses TanStack Query; local UI state uses React state. Do not add
  Redux or Zustand.
- Runtime inputs and API responses use shared Zod schemas from
  `@agentic-kanban/schemas`; the browser parses responses instead of casting.
- Authentication will belong to Better Auth; authorization and every
  tenant-owned `workspace_id` filter belong to the API. The browser never
  decides tenant access.
- Database access goes through `@agentic-kanban/db` using Drizzle and local
  libSQL. Do not add Prisma, Postgres, Supabase, Turso Cloud, or a database
  container.
- Keep exactly the `web` and `api` Docker services. The shared database file is
  `./data/agentic-kanban.db`; never commit database files.
- Pin direct third-party dependencies exactly. Preserve the overrides in the
  root `package.json`.

Layer-specific instructions live in `.cursor/rules/`; keep them scoped and do
not duplicate them here. `README.md` contains the classroom and Docker workflow.

## Commands

```bash
bun install --frozen-lockfile
vp check
vp test
vp build apps/web
docker compose up --build
```

Do not run schema generation or migrations until product tables are explicitly
in scope. Do not add dependencies or implement future course sessions as
cleanup.
