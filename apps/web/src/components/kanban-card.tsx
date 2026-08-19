/**
 * Tarjeta arrastrable. `useSortable` de `@dnd-kit/react/sortable` (no legacy).
 */
import { useSortable } from "@dnd-kit/react/sortable";
import type { Task } from "@agentic-kanban/schemas";
import { GripVertical } from "lucide-react";

import { cn } from "@/lib/utils.ts";

export function KanbanCard({
  task,
  columnId,
  index,
  onEdit,
}: {
  task: Task;
  columnId: string;
  index: number;
  onEdit: (task: Task) => void;
}) {
  const { ref, handleRef, isDragging } = useSortable({
    id: task.id,
    index,
    group: columnId,
    type: "item",
    accept: "item",
    data: { columnId, taskId: task.id },
  });

  return (
    <article
      ref={ref}
      className={cn(
        "rounded-lg border bg-card px-3 py-2 text-sm shadow-xs",
        isDragging && "opacity-60",
      )}
    >
      <div className="flex items-start gap-2">
        <button
          ref={handleRef}
          type="button"
          className="mt-0.5 cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
          aria-label="Mover tarea"
        >
          <GripVertical className="size-4" />
        </button>
        <button type="button" className="min-w-0 flex-1 text-left" onClick={() => onEdit(task)}>
          <h3 className="font-medium">{task.title}</h3>
          {task.description ? (
            <p className="mt-1 text-xs text-muted-foreground">{task.description}</p>
          ) : null}
        </button>
      </div>
    </article>
  );
}
