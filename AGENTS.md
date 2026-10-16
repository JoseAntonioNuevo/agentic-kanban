# Agentic Kanban

Course starter for thePower — Desarrollo Agéntico. It is a small, local-first,
multi-tenant Kanban SaaS skeleton, separate from LangGraph and LangSmith work.

## Context boundary

This repository does not use OpenViking. Ignore inherited OpenViking setup,
`viking://` memory, and session-note requirements; Git, this file, and the
repository documentation are authoritative.

## Current scope

Implemented: the health path, email/password authentication, the two authorized read endpoints and the board API.

```text
React → TanStack Query → /api/health → Vite+ proxy
  → Hono on Bun → Drizzle → local libSQL
React → authClient → /api/auth/* → Vite+ proxy → Better Auth (httpOnly cookie)
```

Better Auth owns the `user`, `session`, `account` and `verification` tables.
The workspace is the tenant: the `workspace`, `workspace_member` (unique per
workspace and user, no role) and `project` tables exist with cascading foreign
keys. The board tables `column` and `task` also exist (each row carries its own
`workspace_id`, cascading foreign keys, `position` with no UNIQUE so reordering
in a transaction works). Workspace contracts (all routes require a session,
`requireSession`):
`GET /api/workspaces` (the user's workspaces, each with `projects: [{ id,
name }]`, `[]` if none) and `GET /api/projects/:projectId` (the project if the
user is a member of its workspace); not a member or not found → 404, never
403 (authorization order in `.cursor/rules/api.mdc`). The web dashboard lists the user's workspaces and projects
(`useWorkspaces`, cache convention in `.cursor/rules/web.mdc`).
A deterministic, idempotent seed (`bun run db:seed`, upserts only, never run
on API start) creates the classroom accounts through Better Auth's
`signUpEmail`: Ana (`ana@demo.test`) and Luis (`luis@demo.test`), fictitious
password `Demo1234!`. `ws_thepower_demo` (project `proj_agentic_kanban`) has
Ana and Luis; `ws_ana_demo` (project `proj_ana_notes`) only Ana. Demo board:
columns `To Do`, `In Progress`, `Done` (`col_kanban_*`, `col_ana_*`), tasks
`task_kanban_1..5` and `task_ana_1`; re-seeding restores those rows.
Board contract (`boardRoutes`, queries `*ForMember` in `@agentic-kanban/db`):
`GET /api/projects/:projectId/board` (200 `{ project, columns: [{ …, tasks }] }`
by `position`), `POST /api/projects/:projectId/tasks` (`{ columnId, title,
description? }` → 201 task), `PATCH /api/tasks/:taskId` (`{ title?,
description? }`, at least one → 200 task), `DELETE /api/tasks/:taskId`
(→ 204) and `POST /api/tasks/:taskId/move` (`{ columnId, position }`, position
an integer ≥ 0 clamped to `0..n` → 200 moved task). No session → 401; not a member or not found → 404, never 403; invalid
input → 400. Client ids (`projectId`, `columnId`, `taskId`) only identify rows:
membership is checked with the row's `workspace_id`, and on create `columnId`
must belong to the same project (else 404); on move the target column must
belong to the task's own project and workspace (else 404, so no cross-project
or cross-workspace moves). Create appends at the end of the column; delete
compacts the column's positions (0..n-1) in a transaction; move takes the task
out, inserts it at `position` and renumbers the affected columns 0..n-1 in one
transaction.
Board UI: the dashboard opens each project in its board (columns and tasks in
order) and the user can create, edit and delete tasks (`useBoard`,
`useTaskMutations`; layer detail in `.cursor/rules/web.mdc`). Every board
mutation uses a `mutationKey` that starts with `["board", projectId, …]`.
Tasks move by drag-and-drop (`@dnd-kit/react` 0.5.1, no `@dnd-kit/helpers`, no
legacy `@dnd-kit/core`/`sortable`) within a column, across columns or into an
empty one. The move is optimistic: the pure `applyBoardMove(board, { taskId,
columnId, position })` in `@agentic-kanban/schemas` (same order as the server)
updates the board cache in `useMoveTask(projectId, userId)`
(`mutationKey: ["board", projectId, "move"]`); on error the snapshot is
restored with a `toast.error`, and on settle the board query is invalidated.
The cache stays the only source of the board, never copied into `useState`.
Postman: `postman/agentic-kanban-session2.postman_collection.json` and
`postman/agentic-kanban-local.postman_environment.json` (import both; `baseUrl`
defaults to `http://localhost:3000`, session cookie only, `Origin: {{origin}}`
is mandatory on every `/api/auth/*` request).
Do not invent other product tables, other demo users, other CRUD,
realtime, comments, mentions, email, deployment,
or session tags before the course work asks for them.

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

Review steps (`06`/`08`) use parallel `kanban-reviewer` (Sonnet, read-only,
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
