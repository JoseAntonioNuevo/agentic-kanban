/**
 * Columna del tablero: nombre, número de tareas y lista en el orden recibido.
 */
import type { BoardColumn } from "@agentic-kanban/schemas";

import { KanbanCard } from "@/components/kanban-card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";

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
  return (
    <Card className="w-72 shrink-0">
      <CardHeader>
        <CardTitle className="min-w-0 truncate text-sm">{column.name}</CardTitle>
        <CardAction>
          <Badge variant="secondary">{column.tasks.length}</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {column.tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin tareas</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {column.tasks.map((task) => (
              <li key={task.id}>
                <KanbanCard
                  task={task}
                  onEdit={() => {
                    onEditTask(task.id);
                  }}
                />
              </li>
            ))}
          </ul>
        )}
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
