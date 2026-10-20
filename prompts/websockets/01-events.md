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

## Fuera de alcance

Hub, SSE, publicación, frontend, tabla de notificaciones, presencia,
comentarios y Socket.IO.

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

1. **Inspección (Grok).** Confirma `taskSchema`, `moveTaskBodySchema` y la API de
   `z.discriminatedUnion` en el Zod 4.6.7 instalado.
2. **Contratos y reparto (Opus); implementación (Grok).** Forma exacta de cada variante de evento. Un worker puede escribir schema,
   tests y documentación; no hace falta dividir este contrato pequeño.
3. **Comprobaciones y revisión.** Grok ejecuta `vp check`, `vp test` y «Hecho cuando». Opus revisa los payloads
   finales y que la unión rechaza eventos inválidos.
4. **Correcciones (Grok).** Opus contrasta diff y evidencia y encarga los
   arreglos confirmados; espera los resultados y repite los checks afectados.
   La puerta general se ejecuta sobre integración estable. CodeRabbit solo
   ante una duda importante que aporte valor, conservando alcance y cobertura;
   no se exige una pasada al terminar cada prompt.

## Hecho cuando

- [ ] `vp check` y `vp test` en verde, con los tests nuevos del schema.

## Al terminar

El implementador que cierra el paso actualiza `AGENTS.md` (el contrato sí; el stream no). No hagas commit. Cierra
con el resumen que pide `AGENTS.md`.
