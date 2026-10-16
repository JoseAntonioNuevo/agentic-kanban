# Sesión 3 · 01 — El contrato de eventos

Tiempo en clase: ~10 min. Tú no editas código: orquestas. Antes de lanzar a los implementadores, presenta un plan de 10 líneas
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

Tú (Opus) orquestas y no editas ficheros: investigan los subagentes Haiku, implementa Sonnet y verifica Haiku. Usa los subagentes de `.claude/agents/`; si tu herramienta no los tiene, haz los mismos pasos en este orden.

1. **Investigar** — `kanban-recon` (Haiku): `taskSchema`, `moveTaskBodySchema` y la API de `z.discriminatedUnion` en el Zod 4.6.7 instalado.
2. **Planificar** — tú: forma exacta de cada evento. Presenta el plan y espera mi «adelante».
3. **Implementar** — `kanban-implementer` (Sonnet): uno solo: schema, tests y documentación de «Al terminar».
4. **Verificar** — `kanban-verifier` (Haiku): puerta de calidad.
5. **Revisar** — tú revisas el diff completo. Si algo falla, encarga el arreglo a un `kanban-implementer` y vuelve a verificar.

## Hecho cuando

- [ ] `vp check` y `vp test` en verde, con los tests nuevos del schema.

## Al terminar

El implementador encargado de la documentación actualiza `AGENTS.md` (el contrato sí; el stream no). No hagas commit. Cierra
con el resumen que pide `AGENTS.md`.
