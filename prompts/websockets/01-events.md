# Sesión 3 · 01 — El contrato de eventos

## Punto de partida

La Sesión 2 está completa: CRUD de tareas, `POST /api/tasks/:taskId/move`,
tablero con TanStack Query y drag-and-drop optimista con `applyBoardMove`. Las
escrituras son HTTP y así se quedan; `apps/api/src/realtime/index.ts` sigue
siendo un placeholder.

## Objetivo

Un contrato Zod que describe los anuncios del tablero y que parsearán igual la
API y el navegador.

## Contrato que fijas aquí

`boardEventSchema` en `packages/schemas/src/events.ts` (exportado con su tipo
`BoardEvent` desde `@agentic-kanban/schemas`): una unión discriminada por
`type`.

| `type`         | Campos además de `projectId` y `actorUserId` |
| -------------- | -------------------------------------------- |
| `task.created` | `task` (`taskSchema`)                        |
| `task.updated` | `task` (`taskSchema`)                        |
| `task.deleted` | `taskId`                                     |
| `task.moved`   | `taskId`, `columnId`, `position` (finales)   |

Reutiliza `taskSchema` y los campos de `moveTaskBodySchema`; no inventes campos
nuevos. El contrato solo describe el anuncio: no es una API de escritura.

## Requisitos

- `z.discriminatedUnion("type", [...])` de Zod 4.6.7 (compruébalo en los tipos
  instalados).
- Tests de parse para cada tipo y de rechazo: `type` desconocido, falta
  `actorUserId`, `task.moved` sin `position`, `task.created` sin `task`.
- `AGENTS.md` describe el contrato; el canal todavía no existe.

## Fuera de alcance

Hub, WebSocket, publicación, frontend, tabla de notificaciones, presencia,
comentarios y Socket.IO.

## Cómo trabajar

1. **Inspeccionar.** Confirma `taskSchema`, `moveTaskBodySchema`, el barrel de
   `@agentic-kanban/schemas` y la API de `z.discriminatedUnion` instalada.
2. **Implementar.** Variantes y payloads del plan. Escribe el schema, su
   exportación, los tests y la línea de `AGENTS.md`.
3. **Comprobar.** Ejecuta `vp check` y `vp test`. Revisa que cada variante
   lleva solo sus campos y que la unión rechaza los eventos inválidos.

## Hecho cuando

- [ ] `vp check` y `vp test` en verde, con los tests nuevos del schema.
