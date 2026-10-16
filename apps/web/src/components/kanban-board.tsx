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
  onDraggingChange,
}: {
  board: BoardResponse;
  onCreateTask: (columnId: string) => void;
  onEditTask: (task: Task) => void;
  onMoveTask: (move: BoardMove) => void;
  /** Avisa al empezar y al terminar un arrastre (los eventos realtime esperan). */
  onDraggingChange: (active: boolean) => void;
}) {
  const handleDragEnd = (event: DragEndEvent) => {
    try {
      moveFromDragEnd(event);
    } finally {
      onDraggingChange(false);
    }
  };

  const moveFromDragEnd = (event: DragEndEvent) => {
    if (event.canceled) {
      return;
    }

    const { source, target } = event.operation;

    if (!isSortable(source)) {
      return;
    }

    const initialGroup = String(source.initialGroup);
    let columnId: string;
    let position: number;

    if (target && !isSortable(target) && String(target.id) !== String(source.group)) {
      // Soltada sobre el hueco de otra columna (o una vacía): al final de sus
      // tareas, aunque por el camino el plugin la metiera en otra columna.
      columnId = String(target.id);
      const destination = board.columns.find((column) => column.id === columnId);
      position = (destination?.tasks ?? []).filter((task) => task.id !== source.id).length;
    } else if (String(source.group) !== initialGroup || source.index !== source.initialIndex) {
      // Al pasar sobre otra tarjeta, el plugin optimista ya movió la fuente (DOM,
      // grupo e índice) y no lo revierte: se persiste ese sitio aunque al soltar
      // el puntero esté en la cabecera de esa columna o fuera de todo.
      columnId = String(source.group);
      position = source.index;
    } else {
      return;
    }

    onMoveTask({ taskId: String(source.id), columnId, position });
  };

  return (
    <DragDropProvider
      key={boardOrderKey(board)}
      onDragStart={() => onDraggingChange(true)}
      onDragEnd={handleDragEnd}
    >
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
