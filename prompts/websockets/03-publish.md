# Sesión 3 · 03 — Publicar después de persistir

Tiempo en clase: ~10 min. Antes de editar nada, presenta un plan de 10 líneas
como máximo (desde qué punto de `board.ts` se publica, con qué payload y cómo
garantizas que ya se persistió) y espera mi «adelante».

## Punto de partida

El hub y el stream funcionan (02); nadie publica todavía. Las escrituras del
tablero viven en `apps/api/src/routes/board.ts`.

## Objetivo

Tras cada escritura HTTP correcta, los suscriptores de ese project reciben el
evento que la describe.

## Requisitos

| Escritura                             | Evento         | Payload                                  |
| ------------------------------------- | -------------- | ---------------------------------------- |
| `POST /api/projects/:projectId/tasks` | `task.created` | la tarea guardada, la misma que responde |
| `PATCH /api/tasks/:taskId`            | `task.updated` | la tarea guardada                        |
| `DELETE /api/tasks/:taskId`           | `task.deleted` | `taskId`                                 |
| `POST /api/tasks/:taskId/move`        | `task.moved`   | `taskId`, `columnId`, `position` finales |

- Publica solo cuando la escritura terminó bien (tras la transacción). Si
  responde 4xx o 5xx, no publiques nada.
- `projectId` sale de la fila y `actorUserId` es el `userId` de la sesión,
  nunca un id del body.
- El contrato HTTP no cambia. El stream no es una API de escritura.
- Tests: suscríbete al hub directamente desde el test, haz la escritura contra
  `app` y comprueba que llega el evento y que pasa `boardEventSchema`; una
  escritura con 404 (usuario ajeno) y otra con 400 no publican nada.

## Fuera de alcance

Frontend y toasts.

## Cómo trabajar

Encárgalo a un `kanban-implementer` (Sonnet, de `.claude/agents/`) con los
tests incluidos; tú revisas el diff. Después, `kanban-verifier` (Haiku) pasa
la puerta de calidad y hace una prueba en vivo: abre el stream de
`proj_agentic_kanban` con la cookie de Luis (`curl -N`), crea una tarea con la
cookie de Ana y comprueba que aparece la línea `data:` del evento.

## Hecho cuando

- [ ] `vp check` y `vp test` en verde.
- [ ] La prueba en vivo muestra el evento `task.created` en el stream de Luis.

## Al terminar

Actualiza `AGENTS.md` (publicar desde las escrituras sí; cliente no). No hagas
commit. Cierra con el resumen que pide `AGENTS.md`.
