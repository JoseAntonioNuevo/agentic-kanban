/**
 * Texto del aviso que ve un usuario cuando otro cambia el tablero abierto.
 * `title` es el de la caché para `task.deleted` y `task.moved`, cuyo evento
 * no lo trae; en created y updated manda el del propio evento.
 */
import type { BoardEvent } from "@agentic-kanban/schemas";

export function boardEventToastMessage(event: BoardEvent, title?: string): string {
  switch (event.type) {
    case "task.created":
      return `Nueva tarea: ${event.task.title}`;
    case "task.updated":
      return `Tarea actualizada: ${event.task.title}`;
    case "task.deleted":
      return title ? `Tarea eliminada: ${title}` : "Tarea eliminada sin título";
    case "task.moved":
      return title ? `Tarea movida: ${title}` : "Tarea movida sin título";
  }
}
