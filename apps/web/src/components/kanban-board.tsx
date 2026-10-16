/**
 * Tablero: las columnas en fila, con scroll horizontal, en el orden recibido
 * (la API ya las entrega ordenadas por `position`). Solo pinta; el board
 * llega por props desde la query de `BoardScreen`.
 */
import type { BoardResponse, Task } from "@agentic-kanban/schemas";

import { KanbanColumn } from "@/components/kanban-column.tsx";

/** Fila de columnas con scroll horizontal. */
export function KanbanBoard({
  board,
  onCreateTask,
  onEditTask,
}: {
  board: BoardResponse;
  onCreateTask: (columnId: string) => void;
  onEditTask: (task: Task) => void;
}) {
  return (
    <div className="flex w-full items-start gap-4 overflow-x-auto pb-2">
      {board.columns.map((column) => (
        <KanbanColumn
          key={column.id}
          column={column}
          onCreateTask={onCreateTask}
          onEditTask={onEditTask}
        />
      ))}
    </div>
  );
}
