Revisa el estado actual del repo antes de proponer cambios.

Estamos construyendo el Kanban de la Sesión 2.

Añade drag and drop de tareas usando exclusivamente `@dnd-kit/react` ya instalada en el proyecto.

Debe permitir:

- reordenar dentro de una columna
- mover entre columnas
- soltar en una columna vacía

Usa TanStack Query para hacer el movimiento optimista:

- guarda el estado anterior de la cache
- actualiza inmediatamente la cache
- envía la mutación al backend
- reconcilia si funciona
- restaura la cache anterior si falla
- muestra un error al usuario si se produce rollback

Requisitos:

TanStack Query sigue siendo la única fuente de verdad del server state.
No mantengas una copia permanente del board en `useState`.
No instales paquetes legacy de dnd-kit.
Revisa los exports de la versión instalada antes de implementar.
El backend sigue siendo la autoridad final.
El movimiento debe persistir después de refrescar.
No implementes realtime.
No implementes comentarios ni notificaciones de otros usuarios.

Plan primero: el flujo completo desde drag hasta persistencia, qué cache modificarás y cómo harás rollback.
Luego implementa. Actualiza `AGENTS.md`: DnD sí; SSE/comentarios no.

Verificación: `vp check --no-fmt`. Mover una carta, persistir al refrescar, rollback si falla.
