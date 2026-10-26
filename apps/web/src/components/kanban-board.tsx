/**
 * Columnas del proyecto en una fila con scroll horizontal.
 * El board llega ya ordenado por `position` desde la query.
 */
import type { BoardResponse } from "@agentic-kanban/schemas";

import { KanbanColumn } from "@/components/kanban-column.tsx";

/** Fila de columnas. No guarda copia del board. */
export function KanbanBoard({
  board,
  onCreateTask,
  onEditTask,
}: {
  board: BoardResponse;
  onCreateTask: (columnId: string) => void;
  onEditTask: (taskId: string) => void;
}) {
  return (
    <div className="flex items-start gap-4 overflow-x-auto pb-2">
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
