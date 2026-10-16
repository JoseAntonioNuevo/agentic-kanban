/**
 * Columna del tablero: título, contador de tareas, tarjetas en el orden
 * recibido y botón para añadir una tarea nueva en esta columna.
 */
import type { BoardColumn, Task } from "@agentic-kanban/schemas";

import { KanbanCard } from "@/components/kanban-card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";

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
  return (
    <section
      aria-label={column.name}
      className="flex w-72 shrink-0 flex-col gap-3 rounded-xl bg-muted/40 p-3"
    >
      <header className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold break-words">{column.name}</h2>
        <Badge variant="secondary">{column.tasks.length}</Badge>
      </header>
      {column.tasks.length === 0 ? (
        <p className="py-2 text-sm text-muted-foreground">Sin tareas</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {column.tasks.map((task) => (
            <li key={task.id}>
              <KanbanCard task={task} onEdit={onEditTask} />
            </li>
          ))}
        </ul>
      )}
      <Button variant="ghost" size="sm" onClick={() => onCreateTask(column.id)}>
        Añadir tarea
      </Button>
    </section>
  );
}
