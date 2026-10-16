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

## Agent workflow

Course steps live in `prompts/<session>/NN-*.md` and run one at a time,
ideally each in a fresh context. A step is self-contained: re-read this file,
the `.cursor/rules/*.mdc` of the layers it touches and the code itself.

- Plan first: present a short plan (files, contracts, delegation, checks) and
  wait for approval before editing. Review steps never edit code.
- The main agent owns the plan, shared contracts (`packages/schemas`, route
  paths, exported names), integration and the final diff review. When a step
  asks for subagents, use the project agents in `.claude/agents/`:
  `kanban-recon` (Haiku, read-only map), `kanban-implementer` (Sonnet, one
  bounded slice), `kanban-verifier` (Haiku, runs checks and HTTP probes,
  never edits) and `kanban-reviewer` (Sonnet, read-only review of one
  dimension). Small changes are faster done directly.
- Write shared contracts before parallel slices start. Two subagents never
  edit the same file; the main agent owns barrels (`src/index.ts`), route
  mounting and docs. A brief states the goal, owned files, exact contract
  names, constraints, checks and the expected report.
- Library APIs: the pinned versions installed in `node_modules` (types and
  source) are the source of truth, not memory or `@latest` docs.
- Done means `vp check` and `vp test` are green (run `vp check --fix` first)
  and the step's acceptance probes were observed. Never weaken or delete a
  test to get green.
- Database: generate migrations on the host. When Compose is up, apply them
  and seed inside the API container (`docker compose exec api bun run
  db:migrate`, `docker compose exec api bun run db:seed`). Never start a
  second API on the host. Tests never touch `data/`.
- Keep this file short: update the current-state and contract sections in
  place and delete statements that stopped being true, here and in
  `.cursor/rules/`. Layer detail belongs in the rules.
- Do not commit or push. End every step with: files changed, checks run with
  their real result, what the teacher should verify by hand, deviations or
  risks, and a Conventional Commit message.

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
