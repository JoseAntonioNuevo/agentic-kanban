# Sesión 4 · 06 — `comment.created` por el canal existente

## Punto de partida

El WebSocket por project, el hub y `useBoardEvents` funcionan desde la
Sesión 3. Los comentarios se crean por HTTP con menciones y email (02–04) y
la campana existe (05).

## Objetivo

Cuando alguien comenta, quien tiene el tablero abierto ve el hilo actualizado
sin refrescar y recibe un aviso, sin abrir una segunda conexión.

## Requisitos

- Añade a `boardEventSchema` el tipo
  `{ type: "comment.created", projectId, actorUserId, comment }` con
  `commentSchema`. `applyBoardEvent` devuelve el board sin cambios para este
  tipo, con un `switch` exhaustivo que siga compilando.
- Publica en el `POST` de comentarios después de persistir el comentario y
  las notificaciones y de intentar la entrega del email. Si el `POST` falla,
  no publiques.
  `actorUserId` sale de la sesión.
- En el cliente, dentro de `useBoardEvents` (sin otro `WebSocket`), al
  recibir `comment.created`:
  - invalida `commentsQueryKey(comment.taskId, userId)` y
    `["notifications", userId]` **siempre**, también si el actor soy yo
    (puede ser otra pestaña mía);
  - `toast.info("Nuevo comentario de {authorName}")` solo si el actor es otro.
    No ignores el evento entero por ser propio: el toast no es la campana.
- La fila de la campana la creó el `POST` del prompt 04 si había una mención;
  el evento solo acelera que se vea.
- HTTP sigue siendo la escritura y el WebSocket solo anuncia: el servidor
  ignora lo que envíe el cliente. Sin Socket.IO ni campana duplicada.
- Tests: el schema acepta y rechaza el nuevo tipo; suscrito al hub, un
  comentario correcto publica `comment.created` y uno con 404 no publica
  nada. Si extraes la lógica del cliente a una función pura, pruébala también.
- `AGENTS.md` y `.cursor/rules/web.mdc` describen `comment.created`.

## Fuera de alcance

Cambios en la campana, reenviar emails y presencia.

## Cómo trabajar

1. **Inspeccionar.** Confirma `boardEventSchema`, `applyBoardEvent`, el `POST`
   de comentarios y `useBoardEvents`.
2. **Implementar.** Forma del evento, publicación y aplicación en cliente del
   plan. Amplía primero el schema y `applyBoardEvent`; después la publicación
   y sus tests, la gestión en `useBoardEvents` y la documentación.
3. **Comprobar.** Ejecuta `vp check` y `vp test`. Revisa que se reutiliza el
   `WebSocket`, que hilo y campana se invalidan también en eco propio y que
   el evento no crea filas de notificación.

## Hecho cuando

- [ ] `vp check` y `vp test` en verde.
- [ ] Dos navegadores (lo compruebo yo): Ana comenta `@Luis mira esto` en
      `proj_agentic_kanban`; Luis, con el tablero abierto, ve el hilo sin
      refrescar, el toast «Nuevo comentario de Ana» y la campana con la
      mención. Ana no ve toast ni fila en su campana.
