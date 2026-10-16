/**
 * Columna del tablero: título, contador de tareas, tarjetas en el orden
 * recibido y botón para añadir una tarea nueva en esta columna.
 *
 * Toda la `<section>` es un destino droppable de baja prioridad frente a las
 * tarjetas: así una columna vacía también acepta tareas.
 */
import type { BoardColumn, Task } from "@agentic-kanban/schemas";
import { useDroppable } from "@dnd-kit/react";

import { KanbanCard } from "@/components/kanban-card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { cn } from "@/lib/utils";

/** Columna con sus tareas; las acciones se delegan en `BoardScreen`. */
export function KanbanColumn({
  column,
  onCreateTask,
  onEditTask,
}: {
  column: BoardColumn;
  onCreateTask: (columnId: string) => void;
  onEditTask: (task: Task) => void;
}) {
  const { ref, isDropTarget } = useDroppable({
    id: column.id,
    type: "column",
    accept: "task",
    collisionPriority: 1,
  });

  return (
    <section
      ref={ref}
      aria-label={column.name}
      className={cn(
        "flex w-72 shrink-0 flex-col gap-3 rounded-xl bg-muted/40 p-3",
        isDropTarget && "bg-muted/70",
      )}
    >
      <header className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold break-words">{column.name}</h2>
        <Badge variant="secondary">{column.tasks.length}</Badge>
      </header>
      {column.tasks.length === 0 ? (
        <p className="py-2 text-sm text-muted-foreground">Sin tareas</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {column.tasks.map((task, index) => (
            <KanbanCard
              key={task.id}
              task={task}
              index={index}
              columnId={column.id}
              onEdit={onEditTask}
            />
          ))}
        </ul>
      )}
      <Button variant="ghost" size="sm" onClick={() => onCreateTask(column.id)}>
        Añadir tarea
      </Button>
    </section>
  );
}
