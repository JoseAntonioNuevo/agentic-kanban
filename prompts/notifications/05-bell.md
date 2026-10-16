# Sesión 4 · 05 — La campana

Tiempo en clase: ~12 min. Tú no editas código: orquestas. Antes de lanzar a los implementadores, presenta un plan de 15 líneas
como máximo y espera mi «adelante».

## Punto de partida

Las menciones crean filas `notification` para su destinatario (04). Todavía
no hay forma de verlas en la aplicación.

## Objetivo

Una campana in-app con las menciones del usuario conectado, un badge con las
no leídas y la opción de marcarlas como leídas.

## Contratos que fijas aquí

- `GET /api/notifications` → `notificationListResponseSchema`: solo las filas
  cuyo `recipient_user_id` es el usuario de la sesión, de la más nueva a la
  más antigua, 50 como máximo.
- `POST /api/notifications/:notificationId/read` → 200 con la notificación
  actualizada; si es de otro usuario o no existe, 404.
- `notificationSchema` en `packages/schemas/src/notification.ts`:
  `{ id, kind, actorName, taskId, taskTitle, projectId, commentPreview,
  createdAt, readAt }`. `createdAt` con `z.iso.datetime()` y `readAt` igual pero
  `.nullable()`; la API los serializa con `Date.toISOString()`.
  `commentPreview` puede ser una cadena vacía (no uses `.min(1)`).
- Rutas en `apps/api/src/routes/notifications.ts`.
- Web: `useNotifications(userId)` y `useMarkNotificationRead(userId)` en
  `apps/web/src/hooks/use-notifications.ts` con la queryKey
  `["notifications", userId]`; `NotificationBell` en
  `apps/web/src/components/notification-bell.tsx`.

## Requisitos

- Autorización de siempre: 401 sin sesión, 404 nunca 403, `workspace_id` de la
  fila.
- La campana usa `popover`, `badge` y `button` de shadcn, que ya existen. Va en
  la cabecera del dashboard y en la del tablero: Luis puede no tener el
  tablero abierto.
- TanStack Query con `refetchOnWindowFocus` y un `refetchInterval` corto
  (~5 s). El popover pinta el JSON de ese `GET` parseado con el mismo schema.
- Estados, sin confundirlos:
  - `GET` correcto con filas → la lista: «{actorName} te mencionó», título de
    la tarea, extracto y «Marcar como leída».
  - `GET` correcto con `[]` → «No hay menciones.» (es un éxito).
  - Solo si `!response.ok` o falla el parse → «No se pudieron cargar las
    menciones.».
  - «Nada pendiente» solo cuando la query fue bien y no hay no leídas; un
    error nunca se pinta como bandeja vacía.
- La campana no es el toast: solo muestra menciones persistidas. Quien escribe
  `@Luis` no ve esa fila en su propia campana.
- Tests de API: Luis ve la mención de Ana; Ana obtiene `[]` para esa mención;
  Luis la marca como leída y `readAt` queda relleno; Ana intentando marcar la
  de Luis → 404; 401 sin sesión; la respuesta real del `GET` pasa
  `notificationListResponseSchema` (las fechas incluidas).

## Fuera de alcance

Tablas nuevas, reenviar emails, React Router, Resend y realtime de
comentarios.

## Cómo trabajar

Tú (Opus) orquestas y no editas ficheros: investigan los subagentes Haiku, implementa Sonnet y verifica Haiku. Usa los subagentes de `.claude/agents/`; si tu herramienta no los tiene, haz los mismos pasos en este orden.

1. **Investigar** — `kanban-recon` (Haiku): consultas de notificaciones existentes, cabeceras del dashboard y del tablero, y componentes `popover` y `badge`.
2. **Planificar** — tú: fija schemas y firmas en los briefs. Presenta el plan y espera mi «adelante».
3. **Implementar** — `kanban-implementer` (Sonnet): primero uno escribe `notification.ts`; después dos en paralelo: A, consultas, rutas y tests de API; B, hooks, `NotificationBell` y su montaje en las dos cabeceras. Uno de ellos actualiza la documentación de «Al terminar».
4. **Verificar** — `kanban-verifier` (Haiku): puerta de calidad y pruebas HTTP: tras una mención de Ana, Luis `GET /api/notifications` → 200 con al menos 1; Ana → 200 `[]`.
5. **Revisar** — tú revisas el diff completo comprobando los estados del popover contra la lista de arriba. Si algo falla, encarga el arreglo a un `kanban-implementer` y vuelve a verificar.

## Hecho cuando

- [ ] `vp check` y `vp test` en verde.
- [ ] Las pruebas HTTP dan lo esperado.
- [ ] Dos navegadores (lo compruebo yo): Ana comenta `@Luis mira esto` (botón
      Comentar); Luis ve badge, «Ana te mencionó», título y extracto; la
      campana de Ana dice «No hay menciones.».

## Al terminar

El implementador encargado de la documentación actualiza `AGENTS.md` (campana sí; realtime de comentarios no). No hagas
commit. Cierra con el resumen que pide `AGENTS.md`.
