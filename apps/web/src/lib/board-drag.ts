/**
 * Traduce el final de un arrastre al movimiento que entiende el servidor.
 *
 * `index` y `group` del origen, cuando dnd-kit ya reordenó, son el hueco en
 * el destino después de sacar la tarea: el mismo `position` que
 * `applyBoardMove`. Una columna sin tarjetas no es sortable; su droppable
 * recibe la tarea en la posición 0. Si el origen y el destino coinciden, no
 * hay movimiento.
 */

export type DragDestination = {
  taskId: string;
  columnId: string;
  position: number;
};

type DragSourceState = {
  id: string;
  index: number;
  initialIndex: number;
  group: string | undefined;
  initialGroup: string | undefined;
};

type DragTargetState =
  | { sortable: true; id: string; index: number; group: string | undefined }
  | { sortable: false; id: string };

export function destinationFromDrag(input: {
  canceled: boolean;
  source: DragSourceState | null;
  target: DragTargetState | null;
}): DragDestination | null {
  if (input.canceled || input.source === null) {
    return null;
  }

  // Tras reordenar, dnd-kit puede dejar el target a null y conservar en el
  // origen el grupo y el índice finales.
  if (input.target === null) {
    if (
      input.source.group === undefined ||
      (input.source.initialGroup === input.source.group &&
        input.source.initialIndex === input.source.index)
    ) {
      return null;
    }

    return {
      taskId: input.source.id,
      columnId: input.source.group,
      position: input.source.index,
    };
  }

  const slot = dropSlot(input.source, input.target);
  if (slot === null) {
    return null;
  }

  if (input.source.initialGroup === slot.columnId && input.source.initialIndex === slot.position) {
    return null;
  }

  return { taskId: input.source.id, columnId: slot.columnId, position: slot.position };
}

function dropSlot(
  source: DragSourceState,
  target: DragTargetState,
): { columnId: string; position: number } | null {
  if (target.sortable) {
    const pluginMoved =
      source.group !== source.initialGroup || source.index !== source.initialIndex;
    if (pluginMoved) {
      if (source.group === undefined) return null;
      return { columnId: source.group, position: source.index };
    }

    if (target.id === source.id || target.group === undefined) return null;
    return { columnId: target.group, position: target.index };
  }

  if (source.group === target.id) {
    return { columnId: target.id, position: source.index };
  }

  return { columnId: target.id, position: 0 };
}
