/**
 * Tarjeta de una tarea. El clic abre el diálogo; un arrastre la mueve.
 * El elemento sortable es el propio botón: así dnd-kit no bloquea el gesto
 * por haber un control dentro de otro.
 */
import { useSortable } from "@dnd-kit/react/sortable";
import type { Task } from "@agentic-kanban/schemas";
import { useRef } from "react";

import { cn } from "@/lib/utils.ts";

/** Tarea arrastrable. Un clic corto, sin desplazamiento, abre la edición. */
export function KanbanCard({
  task,
  index,
  columnId,
  onEdit,
}: {
  task: Task;
  index: number;
  columnId: string;
  onEdit: () => void;
}) {
  const { ref, isDragging } = useSortable({
    id: task.id,
    index,
    group: columnId,
    type: "task",
    accept: "task",
  });
  const pressOrigin = useRef<{ x: number; y: number } | null>(null);

  return (
    <button
      ref={ref}
      type="button"
      onPointerDown={(event) => {
        pressOrigin.current = { x: event.clientX, y: event.clientY };
      }}
      onClick={(event) => {
        const origin = pressOrigin.current;
        if (origin !== null && Math.hypot(event.clientX - origin.x, event.clientY - origin.y) > 5) {
          return;
        }
        onEdit();
      }}
      className={cn(
        "w-full cursor-grab rounded-lg bg-background px-3 py-2 text-left ring-1 ring-foreground/10",
        "touch-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        isDragging && "cursor-grabbing opacity-80",
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
