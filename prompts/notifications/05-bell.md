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
TanStack Query; refetch al foco o intervalo corto.
Campana visible en el dashboard y en el header del board (Luis puede no tener el tablero abierto).
shadcn ya tiene popover, badge, button.
Sin tabla extra, sin email de nuevo, sin React Router, sin Resend.

Plan primero: endpoints, hook, dónde se monta, archivos.
Luego implementa. Actualiza `AGENTS.md`: campana sí; realtime de comentarios no.

Verificación: `vp check --no-fmt`; Luis GET ve la mención de Ana; Ana no ve las de Luis.
