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

- **Sessions 1, 3 and 4:** follow [the Cursor orchestration guide](prompts/CURSOR.md)
  and the selected session prompt in Agent mode with Opus 5.5. Opus only
  coordinates, fixes contracts and reviews. Instances of `kanban-grok-worker`
  inspect, implement, verify and correct with Grok 4.7 xhigh Fast. Every new
  `Task` must explicitly select `grok-4.7-xhigh-fast` when listed in the
  runtime catalog; never omit `model`, use `inherit` or select Claude for a
  worker. Continue autonomously within the requested step, without routine
  plan/correction approvals; split only independent work with disjoint files.
- **Session 2:** follow [the planning and execution guide](prompts/kanban/README.md).
  Opus creates the session plan in Plan mode without implementing. The teacher
  then switches to Agent mode with Grok 4.7 xhigh Fast and runs steps 01–08
  against that plan. Grok is the sole executor; do not spawn subagents.

The old `.claude/agents/kanban-*` agents are historical and are not part of
these four classroom workflows. Do not invoke them or built-in subagents.
`s1-grok-implementer` is a compatibility alias for already-open Session 1
chats; new orchestrated tasks use `kanban-grok-worker`. CodeRabbit is an
additional review when the change or a concrete uncertainty warrants it.

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
