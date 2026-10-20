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
  nunca un id del body.
- El contrato HTTP no cambia. El stream no es una API de escritura.
- Tests: suscríbete al hub directamente desde el test, haz la escritura contra
  `app` y comprueba que llega el evento y que pasa `boardEventSchema`; una
  escritura con 404 (usuario ajeno) y otra con 400 no publican nada.

## Fuera de alcance

Frontend y toasts.

## Cómo trabajar

**Cursor: Agent con Opus 5.5 orquestando de forma autónoma; Grok 4.7 xhigh
Fast ejecuta.** Lee `AGENTS.md`, `prompts/CURSOR.md`,
`prompts/websockets/README.md`, las reglas implicadas y el código. Usa
`kanban-grok-worker` y pasa `model: "grok-4.7-xhigh-fast"` explícito en cada
nueva Task si está en el catálogo; aplica el protocolo común si cambia.
No uses omisión, `inherit`, Claude, agentes históricos ni subagentes integrados.

Este prompt autoriza el paso y sus correcciones locales. Opus coordina,
fija contratos y revisa; Grok inspecciona, implementa, prueba y actualiza el
estado documentado. Continúa sin «adelante» ni aprobación rutinaria del plan.
No hagas commit, no escribas tú la app ni implementes pasos siguientes.

1. **Inspección (Grok).** Confirma escrituras de `board.ts`, dónde termina cada
   transacción y API del hub.
2. **Contratos y reparto (Opus); implementación (Grok).** Punto posterior a persistir y payload final de cada escritura. Un worker
   integra publicación, tests y documentación sin emitir en respuestas fallidas.
3. **Comprobaciones y revisión.** Grok pasa `vp check`, `vp test` y abre el stream de `proj_agentic_kanban`
   con cookie de Luis (`curl -N`); crea una tarea con Ana y comprueba su
   línea `data:`. Opus contrasta los tests que prueban ausencia de publicación
   en errores y el orden persistencia → evento.
4. **Correcciones (Grok).** Opus contrasta diff y evidencia y encarga los
   arreglos confirmados; espera los resultados y repite los checks afectados.
   La puerta general se ejecuta sobre integración estable. CodeRabbit solo
   ante una duda importante que aporte valor, conservando alcance y cobertura;
   no se exige una pasada al terminar cada prompt.

## Hecho cuando

- [ ] `vp check` y `vp test` en verde.
- [ ] La prueba en vivo muestra el evento `task.created` en el stream de Luis.

## Al terminar

El implementador que cierra el paso actualiza `AGENTS.md` (publicar desde las escrituras sí; cliente no). No hagas
commit. Cierra con el resumen que pide `AGENTS.md`.
