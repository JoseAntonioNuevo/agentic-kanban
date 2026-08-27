# Agentic Kanban Course Presentations — Design

## Purpose

Create four Spanish-language PowerPoint decks for thePower's four live classes on a simplified multi-tenant project-management SaaS. Each deck opens a class with approximately ten minutes of explanation before practical work begins.

The first deck is both the general course introduction and the opening for Class 1. The remaining decks introduce Classes 2, 3, and 4 without repeating the full architecture inventory.

## Communication job

By the end of each opening, students should understand what they are about to build, why the relevant architecture was chosen, how that class adds one coherent layer to the product, and what observable result will prove the class is complete.

## Deliverables

Create these editable, Google Slides-compatible PowerPoint files under `presentaciones/`:

1. `01-arquitectura-y-autenticacion.pptx`
2. `02-tablero-kanban.pptx`
3. `03-tiempo-real-sse.pptx`
4. `04-comentarios-y-notificaciones.pptx`

Each deck must:

- target 9–12 slides and about ten minutes of spoken explanation;
- use Spanish audience-facing copy;
- include short speaker notes with pacing and teaching cues;
- cite repository evidence in `[Sources]` blocks in speaker notes;
- remain editable after import into Google Slides;
- avoid unsupported claims and reflect the repository's actual prompt sequence;
- use a shared visual system while giving each class a distinct accent color.

## Shared narrative system

The decks follow a learning progression rather than an agenda dump:

1. What works before this class.
2. What capability is missing.
3. Which architectural boundary solves it.
4. How the class builds that boundary in small prompts.
5. Which demo proves the layer works.
6. Which review protects the previous layers from regression.

The course-wide model is layered growth:

```text
Health path
  → identity + tenant isolation
  → Kanban CRUD + ordering + drag and drop
  → realtime announcements + cache reconciliation
  → comments + mentions + persistent notifications + classroom deploy
```

## Visual direction

Use a restrained teaching-deck system inspired by the bundled Codex Grid layouts:

- 16:9, 1280×720;
- warm off-white or white canvas, charcoal text, pale gray structural regions;
- one dominant ink color plus one class accent;
- geometric grid motif that echoes Kanban columns without looking like an interactive dashboard;
- Helvetica Neue/Arial-compatible typography;
- minimum 50 pt deck title, 35 pt slide title, 24 pt subheading, 16 pt body;
- flat layouts, thin rules, large step numbers, simple native diagrams, no decorative gradients;
- varied silhouettes: cover, timeline, split, dependency map, process flow, comparison, and demo checklist;
- no external stock imagery is needed; the subject is best explained with editable diagrams and typographic composition.

Accent colors:

- Course/Class 1: blue `#3D8DFF`
- Class 2: amber `#F59E0B`
- Class 3: violet `#7C3AED`
- Class 4: emerald `#059669`

## Deck 1 — Architecture and authentication

This deck must explain the whole course and then zoom into Class 1.

1. **Agentic Kanban** — course and product promise.
2. **We will grow one working product in four layers** — final SaaS and cumulative build.
3. **Four classes, four product capabilities** — authentication, Kanban, realtime, notifications.
4. **We start with one complete health path** — React → Query → proxy → Hono → Drizzle → libSQL → Zod.
5. **Four packages keep responsibilities visible** — web, API, DB, shared schemas.
6. **The stack is deliberately small** — explain Bun, Vite+, React, Hono, Drizzle/libSQL, Zod, Docker.
7. **Every dependency has one job** — exact pins, `workspace:*`, installed-now/used-later distinction.
8. **Security is a server-side chain** — TypeScript vs Zod vs auth vs membership vs `workspace_id`.
9. **The class workflow mirrors professional delivery** — inspect, plan, prompt, implement, verify, review.
10. **Class 1 turns health into a multi-tenant product** — registration/login/session/logout plus shared/private workspaces.
11. **Six prompts build authentication without skipping boundaries** — auth, models, GETs, seed, tenant-visible UI, review.
12. **The demo proves identity and isolation** — Ana sees two workspaces, Luis one, protected project returns 404.

## Deck 2 — Kanban board

1. **Class 2 turns tenants into a usable product**.
2. **We inherit a secure identity and workspace boundary**.
3. **The board adds two ordered models** — columns and tasks with `position`.
4. **CRUD remains tenant-scoped** — API endpoints, Zod, session/membership/resource checks.
5. **Postman makes the contract observable before UI**.
6. **TanStack Query owns the board** — queries, mutations, loading/errors/empty columns.
7. **Movement is one backend operation** — reorder/move, same project/workspace, atomic positions.
8. **Drag and drop is optimistic, not authoritative** — snapshot, patch cache, mutate, reconcile/rollback.
9. **The prompt sequence controls complexity** — models → seed → API → Postman → UI → movement → DnD → review.
10. **The demo proves persistence and rollback** — create/edit/delete/move, refresh, forced failure.

## Deck 3 — Realtime collaboration

1. **Class 3 makes two browser sessions share one board**.
2. **HTTP still writes; realtime only announces**.
3. **Why this implementation uses SSE** — server-to-client events fit the one-way requirement and reuse Hono/Vite; explain that the course/folder retains the “WebSockets/tiempo real” label, while SSE and WebSockets are alternative transports and the prompts deliberately choose one-way SSE.
4. **One Zod event contract covers four task changes**.
5. **An in-memory hub scopes subscribers by project** — authenticated and membership-checked stream.
6. **Successful writes publish after persistence** — failures publish nothing.
7. **EventSource patches the TanStack Query cache** — relative URL, shared schema, cleanup on unmount.
8. **Idempotency prevents optimistic updates fighting their echo**.
9. **Toasts explain remote activity without becoming an inbox**.
10. **The demo and review prove isolation** — Ana moves, Luis sees; Luis cannot subscribe to Ana-only project.

## Deck 4 — Comments and notifications

1. **Class 4 turns collaboration into an auditable workflow**.
2. **Comments and notifications are different data**.
3. **Two tenant-owned models preserve context** — comment and notification.
4. **Comments use ordinary authenticated HTTP and TanStack Query**.
5. **A mention is resolved inside the same workspace** — case-insensitive member names, no unknown/self mentions.
6. **Persistence and notification creation are one transaction**.
7. **The email outbox is a classroom-safe delivery boundary** — JSONL under `data/`, no external email service.
8. **The bell is a persistent inbox, not a toast** — recipient-only GET, unread badge, empty vs error.
9. **`comment.created` reuses the existing SSE stream** — invalidate comments and notifications; toast only for other users.
10. **Two browsers prove the full product** — Ana mentions Luis; Luis sees thread, toast, and bell. The teacher can inspect `data/outbox.jsonl` separately as optional server-side evidence.
11. **Compose is the classroom deploy** — two services, reset/migrate/seed/demo/review.

## Source of truth

Content must be derived from:

- `AGENTS.md`
- `README.md`
- `package.json` and package manifests
- `docker-compose.yml`
- `apps/`, `packages/`, `.cursor/rules/`
- `diagrams/01-dependencias.md` through `diagrams/06-capas.md`
- all prompts under `prompts/auth/`, `prompts/kanban/`, `prompts/websockets/`, and `prompts/notifications/`

Do not describe later-session features as already implemented. The starting repository contains only the end-to-end health path and placeholders for authentication and realtime.

## Acceptance criteria

- Exactly four final PPTX files exist with the requested class mapping.
- Deck 1 covers the complete course, architecture, dependencies, rationale, starting state, workflow, and Class 1.
- Decks 2–4 each focus on their class and the exact prompt order.
- The concrete realtime transport is called SSE, with a short explanation of its relationship to the course's broader “WebSockets/tiempo real” label.
- Each deck is paced for approximately ten minutes and includes speaker notes.
- Every slide renders without unintended overlap, clipping, title wrapping, or unresolved placeholders.
- Text extraction contains the expected titles and no planning-only language.
- Final PPTX files pass the presentation overflow check.
