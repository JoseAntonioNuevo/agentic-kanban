# Sesión 3 · 01 — El contrato de eventos

Tiempo en clase: ~10 min. Antes de lanzar a los implementadores, presenta un plan de 10 líneas
como máximo y espera mi «adelante».

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

## Fuera de alcance

Hub, SSE, publicación, frontend, tabla de notificaciones, presencia,
comentarios y Socket.IO.

## Cómo trabajar

Sigue el flujo con subagentes de `AGENTS.md` (Agent workflow). En este paso:

- **Investigar** (Haiku): `taskSchema`, `moveTaskBodySchema` y la API de `z.discriminatedUnion` en el Zod 4.6.7 instalado.
- **Planificar** (Opus): forma exacta de cada evento.
- **Implementar** (Sonnet): uno solo: schema, tests y documentación de «Al terminar».
- **Verificar** (Haiku): puerta de calidad.

## Hecho cuando

- [ ] `vp check` y `vp test` en verde, con los tests nuevos del schema.

## Al terminar

El implementador que cierra el paso actualiza `AGENTS.md` (el contrato sí; el stream no). No hagas commit. Cierra
con el resumen que pide `AGENTS.md`.
