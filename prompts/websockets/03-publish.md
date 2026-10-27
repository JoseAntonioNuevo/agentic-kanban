# Sesión 3 · 03 — Publicar después de persistir

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
  nunca un id del body. `deleteTaskForMember` hoy solo devuelve un booleano:
  amplíalo para que devuelva el `projectId` de la tarea borrada, sin cambiar
  su autorización ni la compactación.
- El contrato HTTP no cambia. El stream no es una API de escritura.
- Tests: suscríbete al hub directamente desde el test, haz la escritura contra
  `app` y comprueba que llega el evento y que pasa `boardEventSchema`; una
  escritura con 404 (usuario ajeno) y otra con 400 no publican nada.
- `AGENTS.md` describe la publicación desde las escrituras; el cliente
  todavía no existe.

## Fuera de alcance

Frontend y toasts.

## Cómo trabajar

1. **Inspeccionar.** Confirma las escrituras de `board.ts`, dónde termina cada
   transacción, qué devuelve cada consulta `ForMember` y la API del hub.
2. **Implementar.** Punto posterior a persistir y payload final del plan.
   Integra la publicación, el dato que falta en el borrado, los tests y la
   documentación.
3. **Comprobar.** Ejecuta `vp check`, `vp test` y la prueba en vivo de «Hecho
   cuando». Revisa los tests que prueban ausencia de publicación en errores y
   el orden persistencia → evento.

## Hecho cuando

- [ ] `vp check` y `vp test` en verde.
- [ ] En vivo: con el stream de `proj_agentic_kanban` abierto con la cookie de
      Luis (`curl -N`), Ana crea una tarea y aparece su línea `data:` con
      `task.created`.
