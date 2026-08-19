Revisa la API de movimiento y la implementación actual del board.

Añade drag and drop de tareas usando exclusivamente la versión moderna de @dnd-kit/react ya instalada en el proyecto.

Debe permitir:

reordenar dentro de una columna
mover entre columnas
soltar en una columna vacía

Usa TanStack Query para hacer el movimiento optimista:

guarda el estado anterior de la cache
actualiza inmediatamente la cache
envía la mutación al backend
reconcilia si funciona
restaura la cache anterior si falla
muestra un error al usuario si se produce rollback

Requisitos:

TanStack Query sigue siendo la única fuente de verdad del server state.
No mantengas una copia permanente del board en useState.
No instales paquetes legacy de dnd-kit.
Revisa los exports de la versión instalada antes de implementar.
El backend sigue siendo la autoridad final.
El movimiento debe persistir después de refrescar.
No implementes realtime.
No implementes comentarios ni notificaciones de otros usuarios.

Primero explica el flujo completo desde drag hasta persistencia, qué cache modificarás y cómo harás rollback.