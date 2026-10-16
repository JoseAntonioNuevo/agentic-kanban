# Sesión 4 · 06 — `comment.created` por el stream existente

Tiempo en clase: ~10 min. Tú no editas código: orquestas. Antes de lanzar a los implementadores, presenta un plan de 12 líneas
como máximo (forma del evento, dónde se publica, cómo lo aplica el cliente) y
espera mi «adelante».

## Punto de partida

El stream SSE por project, el hub y `useBoardEvents` funcionan desde la
Sesión 3. Los comentarios se crean por HTTP con menciones y outbox (02–04) y
la campana existe (05).

## Objetivo

Cuando alguien comenta, quien tiene el tablero abierto ve el hilo actualizado
sin refrescar y recibe un aviso, sin abrir una segunda conexión.

## Requisitos

- Añade a `boardEventSchema` el tipo
  `{ type: "comment.created", projectId, actorUserId, comment }` con
  `commentSchema`. `applyBoardEvent` devuelve el board sin cambios para este
  tipo, con un `switch` exhaustivo que siga compilando.
- Publica en el `POST` de comentarios después de persistir el comentario, las
  notificaciones y el outbox. Si el `POST` falla, no publiques.
  `actorUserId` sale de la sesión.
- En el cliente, dentro de `useBoardEvents` (sin otro `EventSource`), al
  recibir `comment.created`:
  - invalida `commentsQueryKey(comment.taskId, userId)` y
    `["notifications", userId]` **siempre**, también si el actor soy yo
    (puede ser otra pestaña mía);
  - `toast.info("Nuevo comentario de {authorName}")` solo si el actor es otro.
    No ignores el evento entero por ser propio: el toast no es la campana.
- La fila de la campana la creó el `POST` del prompt 04 si había una mención;
  el evento solo acelera que se vea.
- HTTP sigue siendo la escritura y el SSE sigue siendo solo de datos
  (`onmessage`). Sin Socket.IO, sin campana duplicada y sin Resend.
- Tests: el schema acepta y rechaza el nuevo tipo; suscrito al hub, un
  comentario correcto publica `comment.created` y uno con 404 no publica
  nada. Si extraes la lógica del cliente a una función pura, pruébala también.

## Fuera de alcance

Cambios en la campana, reenviar emails y presencia.

## Cómo trabajar

Tú (Opus) orquestas y no editas ficheros: investigan los subagentes Haiku, implementa Sonnet y verifica Haiku. Usa los subagentes de `.claude/agents/`; si tu herramienta no los tiene, haz los mismos pasos en este orden.

1. **Investigar** — `kanban-recon` (Haiku): `boardEventSchema`, `applyBoardEvent`, el `POST` de comentarios y `useBoardEvents`.
2. **Planificar** — tú: forma del evento, dónde se publica y cómo lo aplica el cliente. Presenta el plan y espera mi «adelante».
3. **Implementar** — `kanban-implementer` (Sonnet): primero uno amplía `boardEventSchema` y `applyBoardEvent`; después dos en paralelo: A, publicación y sus tests; B, gestión del evento en `useBoardEvents`. Uno de ellos actualiza la documentación de «Al terminar».
4. **Verificar** — `kanban-verifier` (Haiku): puerta de calidad.
5. **Revisar** — tú revisas el diff completo. Si algo falla, encarga el arreglo a un `kanban-implementer` y vuelve a verificar.

## Hecho cuando

- [ ] `vp check` y `vp test` en verde.
- [ ] Dos navegadores (lo compruebo yo): Ana comenta `@Luis mira esto` en
      `proj_agentic_kanban`; Luis, con el tablero abierto, ve el hilo sin
      refrescar, el toast «Nuevo comentario de Ana» y la campana con la
      mención. Ana no ve toast ni fila en su campana.

## Al terminar

El implementador encargado de la documentación actualiza `AGENTS.md` y `.cursor/rules/web.mdc`. No hagas commit. Cierra con el
resumen que pide `AGENTS.md`.
