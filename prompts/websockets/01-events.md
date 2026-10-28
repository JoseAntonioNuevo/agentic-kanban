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

`boardEventSchema` en `packages/schemas/src/events.ts`, exportado con su tipo
`BoardEvent` desde `@agentic-kanban/schemas`: una unión discriminada por
`type`. Todas las variantes llevan `projectId` y `actorUserId`
(`z.string().min(1)`).

| `type`         | Campos además de `projectId` y `actorUserId` |
| -------------- | -------------------------------------------- |
| `task.created` | `task` (`taskSchema`)                        |
| `task.updated` | `task` (`taskSchema`)                        |
| `task.deleted` | `taskId`                                     |
| `task.moved`   | `taskId`, `columnId`, `position` (finales)   |

Reutiliza `taskSchema` y los campos de `moveTaskBodySchema` (`columnId`,
`position`); no inventes campos nuevos. El contrato solo describe el anuncio:
no es una API de escritura. La Sesión 4 añadirá `comment.created` a esta misma
unión.

## Requisitos

- `z.discriminatedUnion("type", [...])` de Zod 4.6.7 (compruébalo en los tipos
  instalados).
- `events.ts` importa de `board.ts`; `board.ts` no importa valores de
  `events.ts` (el 04 solo importará el tipo).
- Tests en `packages/schemas/src/events.test.ts`: parse de cada tipo y
  rechazo de `type` desconocido, falta de `actorUserId`, `task.moved` sin
  `position` y `task.created` sin `task`.
- `AGENTS.md` describe el contrato en una línea; el canal todavía no existe.

## Fuera de alcance

Hub, WebSocket, publicación, frontend, tabla de notificaciones, presencia,
comentarios y Socket.IO.

## Cómo trabajar

1. **Inspeccionar.** Confirma `taskSchema`, `moveTaskBodySchema`, el barrel de
   `@agentic-kanban/schemas` y la API de `z.discriminatedUnion` instalada.
2. **Implementar.** Escribe el schema, su exportación, los tests y la línea de
   `AGENTS.md`.
3. **Comprobar.** Ejecuta `vp check` y `vp test`. Revisa que cada variante
   lleva solo sus campos y que la unión rechaza los eventos inválidos.

## Hecho cuando

- [ ] `vp check` y `vp test` en verde, con los tests nuevos del schema.
