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
        const targetIsItem = Boolean(target && isSortable(target));
        const columnId = String(
          targetIsItem && target
            ? (target.group ?? source.group ?? "")
            : (target?.id ?? source.group ?? ""),
        );
        const position = source.index;
        const unchanged =
          String(source.initialGroup) === columnId && source.initialIndex === position;
        // #region agent log
        fetch("http://127.0.0.1:7647/ingest/ba5bd8d3-f312-4898-9461-0e2daa745a39", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "81244b" },
          body: JSON.stringify({
            sessionId: "81244b",
            hypothesisId: "C",
            runId: "post-fix",
            location: "kanban-board.tsx:onDragEnd",
            message: "drop resolved",
            data: {
              taskId,
              columnId,
              position,
              sourceGroup: source.group,
              initialGroup: source.initialGroup,
              targetId: target ? String(target.id) : null,
              targetIsItem,
              unchanged,
              canceled: event.canceled,
            },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion

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
