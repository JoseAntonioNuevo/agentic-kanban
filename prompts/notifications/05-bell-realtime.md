# Sesión 4 · 04 — La campana en tiempo real

## Punto de partida

Las menciones crean filas `notification` para su destinatario y envían su
email (03). El WebSocket por project, el hub y `useBoardEvents` funcionan
desde la Sesión 3. Todavía no hay forma de ver las menciones en la aplicación
ni de enterarse de un comentario sin refrescar.

## Objetivo

Una campana in-app con las menciones del usuario conectado, un badge con las
no leídas y la opción de marcarlas como leídas. Cuando alguien comenta, quien
tiene el tablero abierto ve el hilo y la campana al día sin refrescar y recibe
un aviso, por la misma conexión.

## Contratos que fijas aquí

- `GET /api/notifications` → `notificationListResponseSchema`: solo las filas
  cuyo `recipient_user_id` es el usuario de la sesión, de la más nueva a la
  más antigua, 50 como máximo.
- `POST /api/notifications/:notificationId/read` → 200 con la notificación
  actualizada; si es de otro usuario o no existe, 404.
- `notificationSchema` en `packages/schemas/src/notification.ts`:
  `{ id, kind, actorName, taskId, taskTitle, projectId, commentPreview,
  createdAt, readAt }`. `createdAt` con `z.iso.datetime()` y `readAt` igual
  pero `.nullable()`; la API los serializa con `Date.toISOString()`.
  `commentPreview` puede ser una cadena vacía (no uses `.min(1)`).
- Rutas en `apps/api/src/routes/notifications.ts`.
- Web: `useNotifications(userId)` y `useMarkNotificationRead(userId)` en
  `apps/web/src/hooks/use-notifications.ts` con la queryKey
  `["notifications", userId]`; `NotificationBell` en
  `apps/web/src/components/notification-bell.tsx`.
- `comment.created` en `boardEventSchema`:
  `{ type: "comment.created", projectId, actorUserId, comment }` con
  `commentSchema`.

## Requisitos

- **Campana.**
  - Autorización de siempre: 401 sin sesión, 404 nunca 403, `workspace_id` de
    la fila.
  - Usa `popover`, `badge` y `button` de shadcn, que ya existen. Va en la
    cabecera del dashboard y en la del tablero: Luis puede no tener el
    tablero abierto.
  - TanStack Query con `refetchOnWindowFocus` y un `refetchInterval` corto
    (~5 s), que la mantiene al día fuera del tablero. El popover pinta el JSON
    de ese `GET` parseado con el mismo schema.
  - Estados, sin confundirlos:
    - `GET` correcto con filas → la lista: «{actorName} te mencionó», título
      de la tarea, extracto y «Marcar como leída».
    - `GET` correcto con `[]` → «No hay menciones.» (es un éxito).
    - Solo si `!response.ok` o falla el parse → «No se pudieron cargar las
      menciones.».
    - «Nada pendiente» solo cuando la query fue bien y no hay no leídas; un
      error nunca se pinta como bandeja vacía.
  - La campana no es el toast: solo muestra menciones persistidas. Quien
    escribe `@Luis` no ve esa fila en su propia campana.
- **Tiempo real.**
  - `applyBoardEvent` devuelve el board sin cambios para `comment.created`,
    con un `switch` exhaustivo que siga compilando.
  - Publica en el `POST` de comentarios después de persistir el comentario y
    las notificaciones y de intentar la entrega del email. Si el `POST`
    falla, no publiques. `actorUserId` sale de la sesión.
  - En el cliente, dentro de `useBoardEvents` (sin otro `WebSocket`), al
    recibir `comment.created`:
    - invalida `commentsQueryKey(comment.taskId, userId)` y
      `["notifications", userId]` **siempre**, también si el actor soy yo
      (puede ser otra pestaña mía);
    - `toast.info("Nuevo comentario de {authorName}")` solo si el actor es
      otro. No ignores el evento entero por ser propio: el toast no es la
      campana.
  - La fila de la campana la creó el `POST` del 03 si había una mención; el
    evento solo acelera que se vea.
  - HTTP sigue siendo la escritura y el WebSocket solo anuncia: el servidor
    ignora lo que envíe el cliente. Sin Socket.IO ni campana duplicada.
- **Tests.** API: Luis ve la mención de Ana; Ana obtiene `[]` para esa
  mención; Luis la marca como leída y `readAt` queda relleno; Ana intentando
  marcar la de Luis → 404; 401 sin sesión; la respuesta real del `GET` pasa
  `notificationListResponseSchema` (las fechas incluidas). Eventos: el schema
  acepta y rechaza `comment.created`; suscrito al hub, un comentario correcto
  publica `comment.created` y uno con 404 no publica nada. Si extraes la
  lógica del cliente a una función pura, pruébala también.
- `AGENTS.md` y `.cursor/rules/web.mdc` describen la campana y
  `comment.created`.

## Fuera de alcance

Tablas nuevas, reenviar emails, React Router, otros proveedores de correo y
presencia.

## Cómo trabajar

1. **Inspeccionar.** Confirma las consultas de notificaciones, las cabeceras
   del dashboard y del tablero, `popover` y `badge`, `boardEventSchema`,
   `applyBoardEvent`, el `POST` de comentarios y `useBoardEvents`.
2. **Implementar.** Schemas y firmas del plan, empezando por
   `notification.ts` y la variante `comment.created`. Después consultas,
   rutas y tests de API, hooks, `NotificationBell` en las dos cabeceras, la
   publicación, la gestión en `useBoardEvents` y la documentación.
3. **Comprobar.** Ejecuta `vp check`, `vp test` y las pruebas HTTP de «Hecho
   cuando». Revisa los estados del popover, el parse de fechas, que solo el
   destinatario marca como leída, que se reutiliza el `WebSocket` y que hilo
   y campana se invalidan también en eco propio; prepara la prueba manual.

## Hecho cuando

- [ ] `vp check` y `vp test` en verde.
- [ ] HTTP tras una mención de Ana: Luis `GET /api/notifications` → 200
      con al menos una; Ana → 200 `[]`.
- [ ] Dos navegadores (lo compruebo yo): Ana comenta `@Luis mira esto` en
      `proj_agentic_kanban` (botón Comentar). Luis, con el tablero abierto, ve
      el hilo sin refrescar, el toast «Nuevo comentario de Ana», el badge y
      «Ana te mencionó» con título y extracto. Ana no ve toast y su campana
      dice «No hay menciones.».
