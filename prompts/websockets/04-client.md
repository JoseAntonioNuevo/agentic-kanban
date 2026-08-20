Revisa el stream y los hooks del board.

Conecta el cliente al SSE del project abierto.

Debe permitir:

- EventSource a URL relativa `/api/projects/:projectId/events` (same-origin; la cookie de sesión viaja sola). No `baseURL` a `:3000`.
- parsear `event.data` con `boardEventSchema` (el SSE es data-only; usa `onmessage`)
- aplicar el evento a la cache de TanStack Query. Añade `applyBoardEvent` junto a `applyBoardMove` (moved reutiliza `applyBoardMove`; created/updated/deleted hacen patch idempotente). Tests de ese helper.
- ignorar o hacer idempotente el evento si `actorUserId` es el usuario actual (no pelear con el optimistic)
- cerrar el stream al salir del board / unmount

Requisitos:

TanStack Query sigue siendo la única fuente de verdad del server state.
No copies el board a `useState`.
No toasts todavía.
No Socket.IO ni librerías nuevas de realtime.

Plan primero: hook, cuándo se abre/cierra, cómo se parchea la query, archivos concretos.
Luego implementa. Actualiza `AGENTS.md` y rules: cliente sí; toasts no.

Verificación: `vp check --no-fmt`.
Aula: Ana mueve en `ws_thepower_demo` y Luis ve la carta sin refrescar. Luis no recibe eventos de `proj_ana_notes`.
