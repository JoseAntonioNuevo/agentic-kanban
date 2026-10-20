# Agentic Kanban

Course starter for thePower — Desarrollo Agéntico. It is a small, local-first,
multi-tenant Kanban SaaS skeleton, separate from LangGraph and LangSmith work.

## Context boundary

This repository does not use OpenViking. Ignore inherited OpenViking setup,
`viking://` memory, and session-note requirements, and never mention OpenViking
or `viking://` in plans, progress, or summaries (not even to say it was
skipped). Git, this file, and the repository documentation are authoritative.

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
- Product server state uses TanStack Query; local UI state uses React state.
  Authentication session state uses Better Auth's `authClient.useSession()`;
  do not wrap it in `useQuery`. Do not add Redux or Zustand.
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
not duplicate them here. [README.md](README.md) covers startup and links to
the classroom material.

## Agent workflow

Course steps live in `prompts/<session>/NN-*.md` and run one at a time,
ideally each in a fresh context. A step is self-contained: re-read this file,
the `.cursor/rules/*.mdc` of the layers it touches and the code itself.

- **Session 1 (`prompts/auth/01`–`06`):** follow the
  [Cursor guide](prompts/auth/README.md) and the selected prompt. Opus 5.5
  plans/reviews 01 and 03; `s1-grok-implementer` implements and corrects with
  Grok 4.7 Fast. Steps 02, 04 and 05 run directly with Grok. Opus leads 06;
  CodeRabbit runs only when the change or an unresolved risk warrants it.
  Do not invoke `.claude/agents/kanban-*` or Cursor's built-in subagents.
- **Sessions 2–4:** retain the [five-stage Claude Code workflow](prompts/README.md#flujo-de-trabajo-sesiones-24)
  and `.claude/agents/`. Their implementation and review steps follow that
  procedure; do not substitute the Session 1 workflow or `s1-*` agents.

Keep the starter scope above accurate until the classroom prompts implement
the corresponding functionality. The selected course prompt authorizes only
its stated scope; do not treat the rest of the curriculum as a task list.

## Verification and delivery

- Library APIs: the pinned versions installed in `node_modules` (types and
  source) are the source of truth, not memory or `@latest` docs.
- Before checking, run `vp check --fix <edited-files>` only on files owned by
  the current change; never auto-fix unrelated work. Then run `vp check` and
  `vp test` without modifying files. Done also requires the step's acceptance
  probes to be observed. Reuse valid evidence; after corrections rerun the
  affected checks. Never weaken or delete a test to get green.
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

Run schema generation or migrations only when the selected course prompt
explicitly requests them, including the auth tables in Session 1 step 01.
Do not add dependencies or implement future course sessions as cleanup.
