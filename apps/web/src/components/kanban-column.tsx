/**
 * Columna del tablero: nombre, número de tareas y lista en el orden recibido.
 * El droppable de la columna, con prioridad baja, deja que las tarjetas ganen
 * la colisión y aun así acepta una tarea cuando la columna está vacía.
 */
import { CollisionPriority } from "@dnd-kit/abstract";
import { useDroppable } from "@dnd-kit/react";
import type { BoardColumn } from "@agentic-kanban/schemas";

import { KanbanCard } from "@/components/kanban-card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { cn } from "@/lib/utils.ts";

/** Una columna con sus tareas, o el aviso de columna vacía. */
export function KanbanColumn({
  column,
  onCreateTask,
  onEditTask,
}: {
  column: BoardColumn;
  onCreateTask: (columnId: string) => void;
  onEditTask: (taskId: string) => void;
}) {
  const { ref, isDropTarget } = useDroppable({
    id: column.id,
    type: "column",
    accept: "task",
    collisionPriority: CollisionPriority.Low,
  });

  return (
    <Card className="w-72 shrink-0">
      <CardHeader>
        <CardTitle className="min-w-0 truncate text-sm">{column.name}</CardTitle>
        <CardAction>
          <Badge variant="secondary">{column.tasks.length}</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div
          ref={ref}
          className={cn("flex min-h-24 flex-col gap-2 rounded-lg p-1", isDropTarget && "bg-muted")}
        >
          {column.tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin tareas</p>
          ) : (
            column.tasks.map((task, index) => (
              <KanbanCard
                key={task.id}
                task={task}
                index={index}
                columnId={column.id}
                onEdit={() => {
                  onEditTask(task.id);
                }}
              />
            ))
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          className="justify-start"
          onClick={() => {
            onCreateTask(column.id);
          }}
        >
          Añadir tarea
        </Button>
      </CardContent>
    </Card>
  );
}
