# Sesión 3 · 03 — Publicar después de persistir

Tiempo en clase: ~10 min. Tú no editas código: orquestas. Antes de lanzar a los implementadores, presenta un plan de 10 líneas
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

Tú (Opus) orquestas y no editas ficheros: investigan los subagentes Haiku, implementa Sonnet y verifica Haiku. Usa los subagentes de `.claude/agents/`; si tu herramienta no los tiene, haz los mismos pasos en este orden.

1. **Investigar** — `kanban-recon` (Haiku): escrituras de `board.ts`, dónde termina cada transacción y la API del hub.
2. **Planificar** — tú: desde qué punto de cada escritura se publica y con qué payload. Presenta el plan y espera mi «adelante».
3. **Implementar** — `kanban-implementer` (Sonnet): uno solo: publicación, tests y documentación de «Al terminar».
4. **Verificar** — `kanban-verifier` (Haiku): puerta de calidad y prueba en vivo: abre el stream de `proj_agentic_kanban` con la cookie de Luis (`curl -N`), crea una tarea con la cookie de Ana y comprueba que aparece la línea `data:` del evento.
5. **Revisar** — tú revisas el diff completo. Si algo falla, encarga el arreglo a un `kanban-implementer` y vuelve a verificar.

## Hecho cuando

- [ ] `vp check` y `vp test` en verde.
- [ ] La prueba en vivo muestra el evento `task.created` en el stream de Luis.

## Al terminar

El implementador encargado de la documentación actualiza `AGENTS.md` (publicar desde las escrituras sí; cliente no). No hagas
commit. Cierra con el resumen que pide `AGENTS.md`.
