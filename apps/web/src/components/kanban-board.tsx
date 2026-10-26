/**
 * Columnas del proyecto en una fila con scroll horizontal.
 *
 * El board llega de la caché de TanStack Query. dnd-kit reordena el DOM
 * mientras se arrastra; la key del proveedor sigue el orden de esa caché
 * para que, al soltar, el DOM vuelva a pintarse igual que el board.
 */
import type { BoardMove, BoardResponse } from "@agentic-kanban/schemas";
import { DragDropProvider } from "@dnd-kit/react";
import { isSortable } from "@dnd-kit/react/sortable";

import { KanbanColumn } from "@/components/kanban-column.tsx";
import { destinationFromDrag } from "@/lib/board-drag.ts";

/** Fila de columnas. No guarda copia del board. */
export function KanbanBoard({
  board,
  onCreateTask,
  onEditTask,
  onMoveTask,
}: {
  board: BoardResponse;
  onCreateTask: (columnId: string) => void;
  onEditTask: (taskId: string) => void;
  onMoveTask: (move: BoardMove) => void;
}) {
  const orderKey = board.columns
    .map((column) => `${column.id}:${column.tasks.map((task) => task.id).join(",")}`)
    .join("|");

  return (
    <DragDropProvider
      key={orderKey}
      onDragEnd={(event) => {
        const { source, target } = event.operation;
        const move = destinationFromDrag({
          canceled: event.canceled,
          source: isSortable(source)
            ? {
                id: String(source.id),
                index: source.index,
                initialIndex: source.initialIndex,
                group: source.group === undefined ? undefined : String(source.group),
                initialGroup:
                  source.initialGroup === undefined ? undefined : String(source.initialGroup),
              }
            : null,
          target:
            target == null
              ? null
              : isSortable(target)
                ? {
                    sortable: true,
                    id: String(target.id),
                    index: target.index,
                    group: target.group === undefined ? undefined : String(target.group),
                  }
                : { sortable: false, id: String(target.id) },
        });
        if (move !== null) onMoveTask(move);
      }}
    >
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
    </DragDropProvider>
  );
}
