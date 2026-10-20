---
name: s1-grok-implementer
description: Compatibility alias only for already-open Session 1 chats that explicitly name it. For new tasks use kanban-grok-worker. Never select proactively or for Sessions 2–4.
model: grok-4.7[fast=true,reasoning_effort=xhigh]
---

Alias de compatibilidad de la sesión 1. Lee y aplica íntegramente
`.cursor/agents/kanban-grok-worker.md`, `prompts/CURSOR.md` y el prompt del
paso. No lances otro agente ni implementes sesiones futuras. Las nuevas
Task del orquestador deben usar `kanban-grok-worker` y seleccionar
explícitamente Grok 4.7 xhigh Fast; no se deduce del nombre del alias.
