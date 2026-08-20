Revisa las notifications persistidas y el layout (dashboard y header del board).

Añade la campana in-app.

Debe permitir:

- GET /api/notifications → las del usuario de la sesión (no las de otro)
- marcar una como leída
- icono de campana con badge de no leídas
- popover con la lista (quién, tarea, extracto)

Requisitos:

Misma authz: sesión 401; solo las filas cuyo `recipient_user_id` es el usuario actual.
`workspace_id` de la fila. Nunca 403.
TanStack Query; refetch al foco o intervalo corto. `fetch("/api/notifications", { credentials: "include" })`. El popover pinta **el JSON de ese GET** con la misma `notificationListResponseSchema` que la API. `createdAt` / `readAt` salen de `Date.toISOString()` (ms + `Z`); `z.iso.datetime()` tiene que aceptarlos o el GET 200 revienta en el cliente.
Si GET 200 trae ≥1 filas, las listas. Nunca “No se pudieron cargar las menciones.”
Vacío ≠ error: Ana GET 200 `[]` → “No hay menciones.” (éxito). El string de error solo si `!response.ok` o el parse tira. “Nada pendiente” solo si la query **ok** y unread = 0; en isError no aparentes inbox vacío.
Campana visible en el dashboard y en el header del board (Luis puede no tener el tablero abierto).
La campana **no** es el toast: el toast es SSE; aquí solo menciones persistidas. Quien escribe `@Luis` no ve fila en su campana (Ana queda vacía a propósito). Hay que mirar la sesión de Luis.
shadcn ya tiene popover, badge, button.
Sin tabla extra, sin email de nuevo, sin React Router, sin Resend.

Plan primero: endpoints, hook, dónde se monta, archivos.
Luego implementa. Actualiza `AGENTS.md`: campana sí; realtime de comentarios no.

Verificación: `vp check --no-fmt`.
HTTP: Luis GET ve la mención de Ana; Ana GET lista vacía para esa mención.
UI (dos sesiones: Luis en ventana privada): Ana en `proj_agentic_kanban` abre editar, escribe `@Luis mira esto`, pulsa **Comentar**. Network de Luis: `GET /api/notifications` 200 y length ≥ 1. Campana de Luis: badge + “Ana te mencionó” + título + extracto. Si ese JSON tiene filas y el popover dice “No se pudieron cargar las menciones”, el bug es el parse del cliente (no ocultes isError). Campana de Ana: “No hay menciones.”, no el string de error. Un toast de “tarea movida” o de comentario **sin** `@Luis` no llena la campana.
