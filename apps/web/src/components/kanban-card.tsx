/**
 * Tarjeta de una tarea. El clic abre el diálogo en modo editar.
 * El orden lo marca el array del board; aquí no se reordena.
 */
import type { Task } from "@agentic-kanban/schemas";

import { cn } from "@/lib/utils.ts";

/** Tarea pulsable: título y, si hay, descripción recortada a dos líneas. */
export function KanbanCard({ task, onEdit }: { task: Task; onEdit: () => void }) {
  return (
    <button
      type="button"
      onClick={onEdit}
      className={cn(
        "w-full rounded-lg bg-background px-3 py-2 text-left ring-1 ring-foreground/10",
        "hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
      )}
    >
      <span className="block text-sm font-medium break-words">{task.title}</span>
      {task.description.length > 0 ? (
        <span className="mt-1 block line-clamp-2 text-sm text-muted-foreground">
          {task.description}
        </span>
      ) : null}
    </button>
  );
}
