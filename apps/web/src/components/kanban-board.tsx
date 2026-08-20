/**
 * Tablero Kanban. El server state vive en TanStack Query; dnd-kit solo
 * informa el drop. Sin copia permanente del board en useState.
 */
import { DragDropProvider } from "@dnd-kit/react";
import { isSortable } from "@dnd-kit/react/sortable";
import type { Board, Task } from "@agentic-kanban/schemas";

import { KanbanColumn } from "@/components/kanban-column.tsx";
import { useMoveTask } from "@/hooks/use-move-task.ts";

export function KanbanBoard({
  board,
  userId,
  onCreate,
  onEdit,
}: {
  board: Board;
  userId: string | undefined;
  onCreate: (columnId: string) => void;
  onEdit: (task: Task) => void;
}) {
  const moveTask = useMoveTask(board.project.id, userId);
  const boardEpoch = board.columns
    .map((column) => `${column.id}:${column.tasks.map((task) => task.id).join(",")}`)
    .join("|");

  return (
    <DragDropProvider
      key={boardEpoch}
      onDragEnd={(event) => {
        if (event.canceled) {
          return;
        }

        const { source, target } = event.operation;
        if (!isSortable(source)) {
          return;
        }

        const taskId = String(source.id);
        const columnId = String(
          target && isSortable(target)
            ? (target.group ?? source.group ?? "")
            : (target?.id ?? source.group ?? ""),
        );
        const position = source.index;
        const unchanged =
          String(source.initialGroup) === columnId && source.initialIndex === position;

        if (!columnId || unchanged) {
          return;
        }

        moveTask.mutate({ taskId, columnId, position });
      }}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {board.columns.map((column) => (
          <KanbanColumn key={column.id} column={column} onCreate={onCreate} onEdit={onEdit} />
        ))}
      </div>
    </DragDropProvider>
  );
}
