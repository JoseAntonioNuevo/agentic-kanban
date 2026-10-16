# Agentic Kanban Course Presentations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce four editable Spanish PowerPoint decks that introduce the four Agentic Kanban classes in approximately ten minutes each.

**Architecture:** A single JavaScript ES module will define shared presentation tokens, reusable slide primitives, speaker-note helpers, and four independent deck specifications. It will export four PPTX files through `@oai/artifact-tool`, plus per-slide PNGs and montages for QA. Content is sourced exclusively from the current repository and its classroom prompts.

**Tech Stack:** `@oai/artifact-tool`, JavaScript ES modules, bundled Codex presentation runtime, OOXML ZIP inspection, and bundled presentation rendering/overflow helpers.

---

### Task 1: Prepare the isolated build workspace

**Files:**

- Create: `.codex-tmp/course-presentations/source-notes.txt`
- Create: `.codex-tmp/course-presentations/slide-plan.txt`

- [ ] **Step 1: Create a build directory and runtime symlink**

Use these paths returned by `load_workspace_dependencies`:

```text
SKILL_DIR=/Users/jose/.codex/plugins/cache/openai-primary-runtime/presentations/26.826.12353/skills/presentations
TMP_DIR=/Users/jose/Documents/the-power/kanban/.codex-tmp/course-presentations
RUNTIME_NODE=/Users/jose/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node
RUNTIME_NODE_MODULES=/Users/jose/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules
RUNTIME_BIN_DIR=/Users/jose/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/override
RUNTIME_PYTHON=/Users/jose/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3
```

Run:

```bash
mkdir -p /Users/jose/Documents/the-power/kanban/.codex-tmp/course-presentations
ln -s /Users/jose/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules /Users/jose/Documents/the-power/kanban/.codex-tmp/course-presentations/node_modules
mkdir -p /Users/jose/Documents/the-power/kanban/presentaciones
```

Expected: the build directory and output directory exist, and `node_modules` is a symlink to the bundled runtime.

- [ ] **Step 2: Record content provenance**

Inspect and map `AGENTS.md`, `README.md`, all package manifests, `docker-compose.yml`, the current files under `apps/`, `packages/`, and `.cursor/rules/`, all six diagrams, and every prompt in the four prompt directories. Record which sources support each deck in `source-notes.txt`; do not merely list directories.

- [ ] **Step 3: Record the final slide sequence**

Write the approved four-deck outline and per-slide narrative job to `slide-plan.txt`.

### Task 2: Implement the shared presentation system

**Files:**

- Create: `.codex-tmp/course-presentations/build-decks.mjs`

- [ ] **Step 1: Read the required authoring references**

Read completely:

```text
/Users/jose/.codex/plugins/cache/openai-primary-runtime/presentations/26.826.12353/skills/presentations/style_guidelines.md
/Users/jose/.codex/plugins/cache/openai-primary-runtime/presentations/26.826.12353/skills/presentations/artifact_tool_docs/API_QUICK_START.md
/Users/jose/.codex/plugins/cache/openai-primary-runtime/presentations/26.826.12353/skills/presentations/artifact_tool_docs/api/API_DOCS.md
/Users/jose/.codex/plugins/cache/openai-primary-runtime/presentations/26.826.12353/skills/presentations/artifact_tool_docs/api/references/speaker-notes.spec.md
```

- [ ] **Step 2: Define shared tokens**

Implement 1280×720 slide size, Helvetica/Arial typography, common margins, neutral canvas/ink/panel colors, and class accents. Enforce minimums of 50 pt for deck titles, 35 pt for slide titles, 24 pt for subheadings/callout headers, and 16 pt for body text.

- [ ] **Step 3: Define reusable primitives**

Add helpers for covers, takeaway titles, footers, speaker notes, timelines, process arrows, split layouts, comparison layouts, dependency maps, and demo checklists. Keep body text at least 16 pt and slide titles at least 35 pt.

- [ ] **Step 4: Add source-note blocks**

Set notes through `slide.speakerNotes.textFrame.setText(...)`. Every slide's notes must include an approximate timing, a teaching cue, a transition, and end with a `[Sources]` block containing the relevant repository paths.

### Task 3: Author Deck 1

**Files:**

- Modify: `.codex-tmp/course-presentations/build-decks.mjs`
- Create: `presentaciones/01-arquitectura-y-autenticacion.pptx`

- [ ] **Step 1: Add the 12 approved slides**

Cover course promise, four-class roadmap, starting health path, monorepo, stack rationale, dependency ownership, security layers, classroom workflow, and Class 1 sequence/demo.

- [ ] **Step 2: Add speaker notes**

Target 45–60 seconds per slide with concise teaching cues and transitions.

### Task 4: Author Deck 2

**Files:**

- Modify: `.codex-tmp/course-presentations/build-decks.mjs`
- Create: `presentaciones/02-tablero-kanban.pptx`

- [ ] **Step 1: Add the 10 approved slides**

Cover ordered models, tenant-scoped CRUD, Postman, Query ownership, movement transaction, optimistic DnD, prompt sequence, and demo.

- [ ] **Step 2: Add speaker notes**

Target 50–65 seconds per slide and connect every design decision to the practical work that follows.

### Task 5: Author Deck 3

**Files:**

- Modify: `.codex-tmp/course-presentations/build-decks.mjs`
- Create: `presentaciones/03-tiempo-real-sse.pptx`

- [ ] **Step 1: Add the 10 approved slides**

Cover HTTP-write/SSE-announce separation, event schema, Hono hub, publication timing, EventSource cache patching, echo handling, toasts, and isolation demo.

- [ ] **Step 2: Explain the transport precisely**

State that the course capability is realtime collaboration, SSE and WebSockets are alternative transports, and the repository deliberately chooses SSE for this one-way event flow while HTTP remains the only write path.

- [ ] **Step 3: Add speaker notes**

Add 50–65 seconds of teaching cues and a transition to every slide, ending each note with its `[Sources]` block.

### Task 6: Author Deck 4

**Files:**

- Modify: `.codex-tmp/course-presentations/build-decks.mjs`
- Create: `presentaciones/04-comentarios-y-notificaciones.pptx`

- [ ] **Step 1: Add the 11 approved slides**

Cover comment/notification models, comment API/UI, mention resolution, transaction/outbox, bell semantics, `comment.created`, final two-session demo, and Compose classroom deploy.

- [ ] **Step 2: Preserve conceptual boundaries**

Make clear that toast, persistent bell notification, and optional teacher-inspected outbox evidence are three separate effects. Luis sees thread, toast, and bell; the teacher may inspect `data/outbox.jsonl` separately.

- [ ] **Step 3: Add speaker notes**

Add 50–65 seconds of teaching cues and a transition to every slide, ending each note with its `[Sources]` block.

### Task 7: Export and perform deterministic checks

**Files:**

- Create: `.codex-tmp/course-presentations/rendered/**`
- Create: `.codex-tmp/course-presentations/verify-decks.mjs`
- Create: `.codex-tmp/course-presentations/qa-ledger.txt`

- [ ] **Step 1: Mark the artifact operation immediately before the first build**

Set the working directory to the presentations skill directory and run this as one standalone command exactly once:

```bash
node container_tools/mark_artifact_operation_started.mjs --operation-kind create --expected-output-count 4 --output-format pptx
```

Expected: exit code 0.

- [ ] **Step 2: Run the builder with the bundled runtime**

Run:

```bash
RUNTIME_NODE_MODULES=/Users/jose/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules RUNTIME_BIN_DIR=/Users/jose/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/override /Users/jose/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node /Users/jose/Documents/the-power/kanban/.codex-tmp/course-presentations/build-decks.mjs
```

Expected: four named PPTX files are written under `presentaciones/`; PNGs, layouts, and montages remain under `.codex-tmp/course-presentations/`.

- [ ] **Step 3: Assert the exact output set and presentation content**

Implement `verify-decks.mjs` with `@oai/artifact-tool` plus OOXML ZIP inspection. It must assert:

- exact output filenames and no fifth PPTX;
- slide counts `12 / 10 / 10 / 11`;
- the expected title sequence for every deck;
- Spanish audience-facing copy and absence of `Lorem`, `placeholder`, `planning`, and internal production notes in visible content;
- exact dependency versions where displayed;
- typography minimums: 50 pt deck titles, 35 pt slide titles, 24 pt subheadings/callout headers, and 16 pt body text;
- non-empty notes on every slide;
- approximate timing, cue, transition, and terminal `[Sources]` block in every note;
- every cited repository path exists;
- each deck preserves the exact prompt order for its class.

Run:

```bash
RUNTIME_NODE_MODULES=/Users/jose/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules RUNTIME_BIN_DIR=/Users/jose/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/override /Users/jose/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node /Users/jose/Documents/the-power/kanban/.codex-tmp/course-presentations/verify-decks.mjs
```

Expected: `Verified 4 decks, 43 slides, notes and sources.`

- [ ] **Step 4: Run overflow checks with asserted output**

Run each exact overflow command, capture stdout, and assert the success line:

```bash
RUNTIME_NODE=/Users/jose/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node RUNTIME_NODE_MODULES=/Users/jose/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules RUNTIME_BIN_DIR=/Users/jose/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/override /Users/jose/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 /Users/jose/.codex/plugins/cache/openai-primary-runtime/presentations/26.826.12353/skills/presentations/container_tools/slides_test.py /Users/jose/Documents/the-power/kanban/presentaciones/01-arquitectura-y-autenticacion.pptx | tee /Users/jose/Documents/the-power/kanban/.codex-tmp/course-presentations/overflow-01.txt
rg -Fxq 'Test passed. No overflow detected.' /Users/jose/Documents/the-power/kanban/.codex-tmp/course-presentations/overflow-01.txt

RUNTIME_NODE=/Users/jose/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node RUNTIME_NODE_MODULES=/Users/jose/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules RUNTIME_BIN_DIR=/Users/jose/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/override /Users/jose/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 /Users/jose/.codex/plugins/cache/openai-primary-runtime/presentations/26.826.12353/skills/presentations/container_tools/slides_test.py /Users/jose/Documents/the-power/kanban/presentaciones/02-tablero-kanban.pptx | tee /Users/jose/Documents/the-power/kanban/.codex-tmp/course-presentations/overflow-02.txt
rg -Fxq 'Test passed. No overflow detected.' /Users/jose/Documents/the-power/kanban/.codex-tmp/course-presentations/overflow-02.txt

RUNTIME_NODE=/Users/jose/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node RUNTIME_NODE_MODULES=/Users/jose/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules RUNTIME_BIN_DIR=/Users/jose/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/override /Users/jose/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 /Users/jose/.codex/plugins/cache/openai-primary-runtime/presentations/26.826.12353/skills/presentations/container_tools/slides_test.py /Users/jose/Documents/the-power/kanban/presentaciones/03-tiempo-real-sse.pptx | tee /Users/jose/Documents/the-power/kanban/.codex-tmp/course-presentations/overflow-03.txt
rg -Fxq 'Test passed. No overflow detected.' /Users/jose/Documents/the-power/kanban/.codex-tmp/course-presentations/overflow-03.txt

RUNTIME_NODE=/Users/jose/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node RUNTIME_NODE_MODULES=/Users/jose/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules RUNTIME_BIN_DIR=/Users/jose/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/override /Users/jose/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 /Users/jose/.codex/plugins/cache/openai-primary-runtime/presentations/26.826.12353/skills/presentations/container_tools/slides_test.py /Users/jose/Documents/the-power/kanban/presentaciones/04-comentarios-y-notificaciones.pptx | tee /Users/jose/Documents/the-power/kanban/.codex-tmp/course-presentations/overflow-04.txt
rg -Fxq 'Test passed. No overflow detected.' /Users/jose/Documents/the-power/kanban/.codex-tmp/course-presentations/overflow-04.txt
```

Assert stdout contains exactly `Test passed. No overflow detected.` for all four decks. A zero process exit alone is insufficient.

- [ ] **Step 5: Render every final slide**

Render every deck to its exact scratch directory:

```bash
RUNTIME_NODE=/Users/jose/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node RUNTIME_NODE_MODULES=/Users/jose/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules RUNTIME_BIN_DIR=/Users/jose/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/override /Users/jose/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 /Users/jose/.codex/plugins/cache/openai-primary-runtime/presentations/26.826.12353/skills/presentations/container_tools/render_slides.py /Users/jose/Documents/the-power/kanban/presentaciones/01-arquitectura-y-autenticacion.pptx --output_dir /Users/jose/Documents/the-power/kanban/.codex-tmp/course-presentations/rendered/01
RUNTIME_NODE=/Users/jose/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node RUNTIME_NODE_MODULES=/Users/jose/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules RUNTIME_BIN_DIR=/Users/jose/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/override /Users/jose/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 /Users/jose/.codex/plugins/cache/openai-primary-runtime/presentations/26.826.12353/skills/presentations/container_tools/render_slides.py /Users/jose/Documents/the-power/kanban/presentaciones/02-tablero-kanban.pptx --output_dir /Users/jose/Documents/the-power/kanban/.codex-tmp/course-presentations/rendered/02
RUNTIME_NODE=/Users/jose/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node RUNTIME_NODE_MODULES=/Users/jose/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules RUNTIME_BIN_DIR=/Users/jose/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/override /Users/jose/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 /Users/jose/.codex/plugins/cache/openai-primary-runtime/presentations/26.826.12353/skills/presentations/container_tools/render_slides.py /Users/jose/Documents/the-power/kanban/presentaciones/03-tiempo-real-sse.pptx --output_dir /Users/jose/Documents/the-power/kanban/.codex-tmp/course-presentations/rendered/03
RUNTIME_NODE=/Users/jose/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node RUNTIME_NODE_MODULES=/Users/jose/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules RUNTIME_BIN_DIR=/Users/jose/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/override /Users/jose/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 /Users/jose/.codex/plugins/cache/openai-primary-runtime/presentations/26.826.12353/skills/presentations/container_tools/render_slides.py /Users/jose/Documents/the-power/kanban/presentaciones/04-comentarios-y-notificaciones.pptx --output_dir /Users/jose/Documents/the-power/kanban/.codex-tmp/course-presentations/rendered/04
```

Create each montage in scratch:

```bash
RUNTIME_NODE=/Users/jose/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node RUNTIME_NODE_MODULES=/Users/jose/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules RUNTIME_BIN_DIR=/Users/jose/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/override /Users/jose/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 /Users/jose/.codex/plugins/cache/openai-primary-runtime/presentations/26.826.12353/skills/presentations/container_tools/create_montage.py --input_dir /Users/jose/Documents/the-power/kanban/.codex-tmp/course-presentations/rendered/01 --output_file /Users/jose/Documents/the-power/kanban/.codex-tmp/course-presentations/montage-01.png
RUNTIME_NODE=/Users/jose/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node RUNTIME_NODE_MODULES=/Users/jose/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules RUNTIME_BIN_DIR=/Users/jose/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/override /Users/jose/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 /Users/jose/.codex/plugins/cache/openai-primary-runtime/presentations/26.826.12353/skills/presentations/container_tools/create_montage.py --input_dir /Users/jose/Documents/the-power/kanban/.codex-tmp/course-presentations/rendered/02 --output_file /Users/jose/Documents/the-power/kanban/.codex-tmp/course-presentations/montage-02.png
RUNTIME_NODE=/Users/jose/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node RUNTIME_NODE_MODULES=/Users/jose/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules RUNTIME_BIN_DIR=/Users/jose/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/override /Users/jose/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 /Users/jose/.codex/plugins/cache/openai-primary-runtime/presentations/26.826.12353/skills/presentations/container_tools/create_montage.py --input_dir /Users/jose/Documents/the-power/kanban/.codex-tmp/course-presentations/rendered/03 --output_file /Users/jose/Documents/the-power/kanban/.codex-tmp/course-presentations/montage-03.png
RUNTIME_NODE=/Users/jose/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node RUNTIME_NODE_MODULES=/Users/jose/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules RUNTIME_BIN_DIR=/Users/jose/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/override /Users/jose/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 /Users/jose/.codex/plugins/cache/openai-primary-runtime/presentations/26.826.12353/skills/presentations/container_tools/create_montage.py --input_dir /Users/jose/Documents/the-power/kanban/.codex-tmp/course-presentations/rendered/04 --output_file /Users/jose/Documents/the-power/kanban/.codex-tmp/course-presentations/montage-04.png
```

Expected: 43 total slide PNGs and four montages, all under `.codex-tmp/course-presentations/`.

### Task 8: Visual QA and correction loop

**Files:**

- Modify: `.codex-tmp/course-presentations/build-decks.mjs`
- Modify: `.codex-tmp/course-presentations/qa-ledger.txt`

- [ ] **Step 1: Inspect every slide at full size**

Check title wrapping, text clipping, margins, contrast, alignment, connector order, visual pacing, and cross-deck consistency.

- [ ] **Step 2: Record at least one concrete first-pass issue**

Treat the first render as a bug hunt and document slide number, observed issue, and before-render path in `qa-ledger.txt`.

- [ ] **Step 3: Fix and re-export**

Change `build-decks.mjs`, regenerate all affected decks, and rerun the exact-output, structure/notes/text, overflow, and rendering commands from Task 7.

- [ ] **Step 4: Fresh visual verification**

Inspect every regenerated slide individually at full size and record before/fix/after evidence in `qa-ledger.txt`. Then have an independent reviewer inspect the final renders. Resolve all unintended overlaps, clipping, and serious narrative issues, rerun the checks, and record final passing outcomes.

### Task 9: Final handoff

**Files:**

- Final: `presentaciones/01-arquitectura-y-autenticacion.pptx`
- Final: `presentaciones/02-tablero-kanban.pptx`
- Final: `presentaciones/03-tiempo-real-sse.pptx`
- Final: `presentaciones/04-comentarios-y-notificaciones.pptx`

- [ ] **Step 1: Confirm the final Git diff contains only intended deliverables and planning documents**

- [ ] **Step 2: Open the output folder or primary deck in Codex for the user**

- [ ] **Step 3: Report the four files, slide counts, verification performed, and the SSE/WebSockets clarification**
