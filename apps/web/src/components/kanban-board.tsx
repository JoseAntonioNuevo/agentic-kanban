/**
 * Tablero: las columnas en fila, con scroll horizontal, en el orden recibido
 * (la API ya las entrega ordenadas por `position`). Solo pinta; el board
 * llega por props desde la query de `BoardScreen`.
 *
 * El arrastre usa `DragDropProvider` de dnd-kit. Al soltar, `onDragEnd` calcula
 * columna y posición destino y delega en `onMoveTask`; la caché optimista la
 * actualiza `useMoveTask`. dnd-kit reordena nodos del DOM mientras se arrastra,
 * así que el proveedor se remonta con una `key` derivada del orden del board:
 * tras cada cambio de caché el DOM vuelve a coincidir con el estado de React.
 */
import type { BoardMove, BoardResponse, Task } from "@agentic-kanban/schemas";
import { DragDropProvider, type DragEndEvent } from "@dnd-kit/react";
import { isSortable } from "@dnd-kit/react/sortable";

import { KanbanColumn } from "@/components/kanban-column.tsx";

/** Huella del orden del board: cambia solo si cambia alguna columna o tarea de sitio. */
function boardOrderKey(board: BoardResponse): string {
  return board.columns
    .map((column) => `${column.id}:${column.tasks.map((task) => task.id).join(",")}`)
    .join("|");
}

/** Fila de columnas con scroll horizontal y arrastre de tareas. */
export function KanbanBoard({
  board,
  onCreateTask,
  onEditTask,
  onMoveTask,
}: {
  board: BoardResponse;
  onCreateTask: (columnId: string) => void;
  onEditTask: (task: Task) => void;
  onMoveTask: (move: BoardMove) => void;
}) {
  const handleDragEnd = (event: DragEndEvent) => {
    if (event.canceled) {
      return;
    }

    const { source, target } = event.operation;

    if (!isSortable(source) || !target) {
      return;
    }

    let columnId: string;
    let position: number;

    if (isSortable(target) || target.id === source.id) {
      // Sobre otra tarjeta, el plugin optimista ya actualizó grupo e índice de la fuente.
      columnId = String(source.group);
      position = source.index;
    } else {
      // Soltada sobre una columna: al final de sus tareas (sin contar la propia).
      columnId = String(target.id);
      const destination = board.columns.find((column) => column.id === columnId);
      position = (destination?.tasks ?? []).filter((task) => task.id !== source.id).length;
    }

    if (columnId === String(source.initialGroup) && position === source.initialIndex) {
      return;
    }

    onMoveTask({ taskId: String(source.id), columnId, position });
  };

  return (
    <DragDropProvider key={boardOrderKey(board)} onDragEnd={handleDragEnd}>
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
    </DragDropProvider>
  );
}
