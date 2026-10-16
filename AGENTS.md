# Agentic Kanban

Course starter for thePower — Desarrollo Agéntico. It is a small, local-first,
multi-tenant Kanban SaaS skeleton, separate from LangGraph and LangSmith work.

## Context boundary

This repository does not use OpenViking. Ignore inherited OpenViking setup,
`viking://` memory, and session-note requirements; Git, this file, and the
repository documentation are authoritative.

## Current scope

Implemented: health, email/password auth (Better Auth, httpOnly cookie), the
multi-tenant model, authorized reads, the board API, the board UI with task
CRUD and optimistic drag-and-drop, the classroom seed and a Postman collection.

```text
React → TanStack Query / authClient → /api/* → Vite+ proxy
  → Hono on Bun (requireSession → membership) → Drizzle → local libSQL
```

- Tables: Better Auth (`user`, `session`, `account`, `verification`), tenant
  (`workspace`, `workspace_member` unique per workspace and user, no role,
  `project`) and board (`column`, `task`, each with its own `workspace_id`,
  `position` without UNIQUE). Foreign keys cascade.
- Routes: `GET /api/workspaces`, `GET /api/projects/:projectId`,
  `GET /api/projects/:projectId/board`, `POST /api/projects/:projectId/tasks`,
  `PATCH`/`DELETE /api/tasks/:taskId`, `POST /api/tasks/:taskId/move`. No
  session → 401; not a member or not found → 404, never 403; invalid input → 400. Client ids only identify rows (details in `.cursor/rules/api.mdc` and
  `db.mdc`).
- Web: dashboard → board (`selectedProjectId`, no router). Server state only in
  TanStack Query: queryKeys include `userId`, board mutations use
  `mutationKey: ["board", projectId, …]`, sign-out calls `queryClient.clear()`.
  `applyBoardMove` (in `@agentic-kanban/schemas`) and `useMoveTask` are the
  optimistic move (details in `.cursor/rules/web.mdc`).
- Events: `boardEventSchema` (`packages/schemas/src/events.ts`) is the contract
  with 4 types (`task.created`, `task.updated`, `task.deleted`, `task.moved`);
  there is no stream or publishing yet, writes stay HTTP.
- Seed: `bun run db:seed`, idempotent upserts by fixed id, never on API start.
  Ana (`ana@demo.test`) and Luis (`luis@demo.test`), fictitious password
  `Demo1234!`; `ws_thepower_demo`/`proj_agentic_kanban` has both,
  `ws_ana_demo`/`proj_ana_notes` only Ana; demo columns `col_kanban_*`,
  `col_ana_*`, tasks `task_kanban_1..5`, `task_ana_1`. Run it before class:
  re-seeding restores the demo rows but not tasks created in class.
- Postman: import `postman/agentic-kanban-session2.postman_collection.json`
  and `postman/agentic-kanban-local.postman_environment.json`; `Origin:
  {{origin}}` is mandatory on `/api/auth/*`.

Do not invent other product tables, demo users, CRUD, realtime, comments,
mentions, email, deployment or session tags before the course asks for them.

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
- Authentication belongs to Better Auth (cookie session, `/api/auth/*`);
  authorization and every tenant-owned `workspace_id` filter belong to the
  API. The browser never decides tenant access.
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

Every implementation step runs the same five-stage flow with the project
agents in `.claude/agents/`. Each prompt only adds what is specific to its
step (what to inspect, the slices, the probes, the review focus). Without
subagents, do the same stages yourself in order.

1. **Investigate** with `kanban-recon` (Haiku, read-only): current state of the
   repo and the installed APIs the step needs. Run several in parallel when
   the areas are independent.
2. **Plan** (main agent, Opus): a short plan with files, contracts, slices and
   checks. Fix the shared contracts (`packages/schemas`, route paths,
   exported names) in the briefs. Wait for the teacher's approval.
3. **Implement** with `kanban-implementer` (Sonnet): all code, tests and docs,
   in bounded slices. When slices share contracts, one implementer writes
   them first; then the rest run in parallel. Two subagents never edit the
   same file. A brief states the goal, owned files, exact contract names,
   constraints, checks and the expected report. The main agent does not edit
   files during this stage.
4. **Verify** with `kanban-verifier` (Haiku, never edits): the gate and the
   step's probes.
5. **Review** (main agent, Opus): read the final diff and the subagents'
   reports, check that what Sonnet wrote is correct and complete, then fix
   what is wrong and polish what is unfinished yourself. Run
   `kanban-verifier` again after your changes.

Review steps (the last `*-review.md` of each session) use parallel `kanban-reviewer` (Sonnet, read-only,
one dimension each) plus `kanban-verifier`; the main agent confirms each
finding in the code and, once the teacher approves the plan, applies the
fixes itself.

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

API tests: `vp test`. They use their own temporary database and a test
`BETTER_AUTH_SECRET`, configured in `vite.config.ts` (`test`) and
`apps/api/src/test/setup.ts`; they never touch `data/`.

Migrations: `bun run db:generate` on the host, apply with
`docker compose exec api bun run db:migrate`. Do not add dependencies or
implement future course sessions as cleanup.
