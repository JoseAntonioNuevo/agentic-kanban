/**
 * Tarjeta de una tarea: un botón accesible que abre el diálogo en modo editar.
 *
 * Muestra el título y la descripción recortada a un par de líneas (CSS).
 * No guarda estado: la tarea llega del board que posee TanStack Query.
 */
import type { Task } from "@agentic-kanban/schemas";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";

/** Tarjeta clicable de una tarea. */
export function KanbanCard({ task, onEdit }: { task: Task; onEdit: (task: Task) => void }) {
  return (
    <button
      type="button"
      onClick={() => onEdit(task)}
      className="block w-full cursor-pointer rounded-xl text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card size="sm" className="transition-colors hover:bg-muted/50">
        <CardHeader>
          <CardTitle className="text-sm break-words">{task.title}</CardTitle>
        </CardHeader>
        {task.description !== "" ? (
          <CardContent>
            <p className="line-clamp-2 text-xs break-words text-muted-foreground">
              {task.description}
            </p>
          </CardContent>
        ) : null}
      </Card>
    </button>
  );
}
