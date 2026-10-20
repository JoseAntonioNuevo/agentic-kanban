# Sesión 4 · 05 — La campana

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

1. **Inspección (Grok).** Confirma consultas de notificaciones, cabeceras del
   dashboard/tablero y componentes `popover` y `badge`.
2. **Contratos y reparto (Opus); implementación (Grok).** Schemas y firmas primero. Tras escribir `notification.ts`, puede dividir
   consultas/rutas/tests de API y hooks/`NotificationBell`/las dos cabeceras,
   con archivos propios y documentación asignada.
3. **Comprobaciones y revisión.** Grok pasa `vp check`, `vp test` y prueba tras una mención de Ana: Luis
   `GET /api/notifications` → 200 con al menos una; Ana → 200 `[]`. Opus
   comprueba los estados del popover, parse de fechas y lectura solo por el
   destinatario; prepara la prueba manual de ambas cabeceras.
4. **Correcciones (Grok).** Opus contrasta diff y evidencia y encarga los
   arreglos confirmados; espera los resultados y repite los checks afectados.
   La puerta general se ejecuta sobre integración estable. CodeRabbit solo
   ante una duda importante que aporte valor, conservando alcance y cobertura;
   no se exige una pasada al terminar cada prompt.

## Hecho cuando

- [ ] `vp check` y `vp test` en verde.
- [ ] Las pruebas HTTP dan lo esperado.
- [ ] Dos navegadores (lo compruebo yo): Ana comenta `@Luis mira esto` (botón
      Comentar); Luis ve badge, «Ana te mencionó», título y extracto; la
      campana de Ana dice «No hay menciones.».

## Al terminar

El implementador que cierra el paso actualiza `AGENTS.md` (campana sí; realtime de comentarios no). No hagas
commit. Cierra con el resumen que pide `AGENTS.md`.
