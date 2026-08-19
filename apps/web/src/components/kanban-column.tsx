/**
 * Columna droppable (incluye vacías). `useDroppable` de `@dnd-kit/react`.
 */
import { KanbanCard } from "@/components/kanban-card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { cn } from "@/lib/utils.ts";
import { useDroppable } from "@dnd-kit/react";
import type { BoardColumn, Task } from "@agentic-kanban/schemas";

export function KanbanColumn({
  column,
  onCreate,
  onEdit,
}: {
  column: BoardColumn;
  onCreate: (columnId: string) => void;
  onEdit: (task: Task) => void;
}) {
  const { ref, isDropTarget } = useDroppable({
    id: column.id,
    accept: "item",
    collisionPriority: 1,
  });

  return (
    <section
      ref={ref}
      className={cn(
        "flex min-h-72 w-72 shrink-0 flex-col rounded-xl border bg-muted/40 p-3",
        isDropTarget && "ring-2 ring-ring",
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium">{column.name}</h2>
        <Button type="button" variant="outline" size="sm" onClick={() => onCreate(column.id)}>
          Nueva
        </Button>
      </div>
      <div className="flex flex-1 flex-col gap-2">
        {column.tasks.length === 0 ? (
          <p className="rounded-lg border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
            No hay tareas
          </p>
        ) : (
          column.tasks.map((task, index) => (
            <KanbanCard
              key={task.id}
              task={task}
              columnId={column.id}
              index={index}
              onEdit={onEdit}
            />
          ))
        )}
      </div>
    </section>
  );
}
