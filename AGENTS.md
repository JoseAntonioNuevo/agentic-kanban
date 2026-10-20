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

**Session 1 only (`prompts/auth/01`–`06`):** follow
`prompts/auth/README.md` and the execution mode in the selected prompt.
In Cursor, Opus 5.5 plans/reviews steps 01 and 03 and delegates implementation
and corrections to `s1-grok-implementer`; Grok 4.7 Fast handles 02, 04 and 05
directly. Step 06 closes verification and uses CodeRabbit when the change or
an unresolved risk warrants it. No mandatory Haiku/Sonnet agents, parallel
reviewers, or repeated reviews. The `s1-*` agents are exclusive to Session 1;
do not use them for Sessions 2–4. In Session 1, do not invoke the
`.claude/agents/kanban-*` agents or Cursor's built-in subagents. Keep the
starter scope above accurate until
the classroom prompts actually implement it.

**Sessions 2–4 retain the following workflow and `.claude/agents/`.**
Every implementation step in those sessions runs the same five-stage flow with the project
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

Do not run schema generation or migrations until product tables are explicitly
in scope. Do not add dependencies or implement future course sessions as
cleanup.
