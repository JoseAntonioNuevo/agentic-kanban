/**
 * Tarjeta de una tarea: elemento ordenable de dnd-kit con un botón accesible
 * que abre el diálogo en modo editar.
 *
 * Muestra el título y la descripción recortada a un par de líneas (CSS).
 * No guarda estado: la tarea llega del board que posee TanStack Query. El
 * `<li>` es la fuente del arrastre; el botón interior sigue siendo clicable
 * porque dnd-kit solo arranca tras mover el puntero (distancia/retardo) y
 * suprime el click al soltar.
 */
import type { Task } from "@agentic-kanban/schemas";
import { KeyboardSensor, PointerSensor } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { cn } from "@/lib/utils";

/**
 * Por defecto dnd-kit no arranca un arrastre desde un `<button>` hijo de la
 * fuente. Aquí sí: se mantiene el umbral de distancia/retardo del sensor.
 */
const sensors = [PointerSensor.configure({ preventActivation: () => false }), KeyboardSensor];

/** Tarjeta ordenable y clicable de una tarea. */
export function KanbanCard({
  task,
  index,
  columnId,
  onEdit,
}: {
  task: Task;
  index: number;
  columnId: string;
  onEdit: (task: Task) => void;
}) {
  const { ref, isDragging } = useSortable({
    id: task.id,
    index,
    group: columnId,
    type: "task",
    accept: "task",
    sensors,
  });

  return (
    <li ref={ref} className={cn(isDragging && "opacity-60")}>
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
    </li>
  );
}
