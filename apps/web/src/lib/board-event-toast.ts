/**
 * Texto del toast para un evento del tablero originado por otro usuario.
 *
 * Función pura: `created` y `updated` toman el título del evento; `deleted` y
 * `moved` solo traen `taskId`, así que el título (si se conoce) viene de la
 * caché del board anterior a aplicar el evento.
 */
import type { BoardEvent } from "@agentic-kanban/schemas";

export function boardEventToastMessage(event: BoardEvent, title?: string): string {
  switch (event.type) {
    case "task.created":
      return `Nueva tarea: ${event.task.title}`;
    case "task.updated":
      return `Tarea actualizada: ${event.task.title}`;
    case "task.deleted":
      return title ? `Tarea eliminada: ${title}` : "Tarea eliminada";
    case "task.moved":
      return title ? `Tarea movida: ${title}` : "Tarea movida";
    case "comment.created":
      return `Nuevo comentario de ${event.comment.authorName}`;
  }
}
