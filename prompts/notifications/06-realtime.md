# Sesión 4 · 06 — `comment.created` por el stream existente

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

**Cursor: Agent con Opus 5.5 orquestando de forma autónoma; Grok 4.7 xhigh
Fast ejecuta.** Lee `AGENTS.md`, `prompts/CURSOR.md`,
`prompts/notifications/README.md`, las reglas implicadas y el código. Usa
`kanban-grok-worker` y pasa `model: "grok-4.7-xhigh-fast"` explícito en cada
nueva Task si está en el catálogo; aplica el protocolo común si cambia.
No uses omisión, `inherit`, Claude, agentes históricos ni subagentes integrados.

Este prompt autoriza el paso y sus correcciones locales. Opus coordina,
fija contratos y revisa; Grok inspecciona, implementa, prueba y actualiza el
estado documentado. Continúa sin «adelante» ni aprobación rutinaria del plan.
No hagas commit, no escribas tú la app ni implementes pasos siguientes.

1. **Inspección (Grok).** Confirma `boardEventSchema`, `applyBoardEvent`, POST
   de comentarios y `useBoardEvents`.
2. **Contratos y reparto (Opus); implementación (Grok).** Forma del evento, publicación y aplicación en cliente. Primero amplía
   schema y `applyBoardEvent`; después puede repartir publicación/tests y
   gestión en `useBoardEvents`. Un responsable integra documentación y evita
   que dos workers editen el mismo contrato.
3. **Comprobaciones y revisión.** Grok pasa `vp check`, `vp test` y «Hecho cuando». Opus revisa que se
   reutiliza el EventSource, se invalidan hilo y campana también en eco propio
   y el evento no vuelve a crear filas de notificación.
4. **Correcciones (Grok).** Opus contrasta diff y evidencia y encarga los
   arreglos confirmados; espera los resultados y repite los checks afectados.
   La puerta general se ejecuta sobre integración estable. CodeRabbit solo
   ante una duda importante que aporte valor, conservando alcance y cobertura;
   no se exige una pasada al terminar cada prompt.

## Hecho cuando

- [ ] `vp check` y `vp test` en verde.
- [ ] Dos navegadores (lo compruebo yo): Ana comenta `@Luis mira esto` en
      `proj_agentic_kanban`; Luis, con el tablero abierto, ve el hilo sin
      refrescar, el toast «Nuevo comentario de Ana» y la campana con la
      mención. Ana no ve toast ni fila en su campana.

## Al terminar

El implementador que cierra el paso actualiza `AGENTS.md` y `.cursor/rules/web.mdc`. No hagas commit. Cierra con el
resumen que pide `AGENTS.md`.
