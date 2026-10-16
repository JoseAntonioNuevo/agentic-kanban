/**
 * Pantalla del tablero de un project.
 *
 * `useBoard` (TanStack Query) es la única fuente del board: aquí no se copia
 * a `useState`. El estado local es solo el diálogo (crear/editar/cerrado).
 * Los movimientos por arrastre pasan por `useMoveTask` (optimista, con rollback).
 * `useBoardEvents` abre el stream SSE del tablero y parchea esa misma caché.
 * Estados: cargando, 404 («Proyecto no encontrado»), error genérico con
 * reintento (solo sin datos en caché) y el tablero. El botón «Volver» devuelve al dashboard.
 */
import { useState } from "react";
import type { Task } from "@agentic-kanban/schemas";

import { KanbanBoard } from "@/components/kanban-board.tsx";
import { TaskFormDialog, type TaskDialogState } from "@/components/task-form-dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { BoardNotFoundError, useBoard } from "@/hooks/use-board.ts";
import { useBoardEvents } from "@/hooks/use-board-events.ts";
import { useMoveTask } from "@/hooks/use-move-task.ts";

/** Cabecera + estado de carga/error/404 + tablero con su diálogo. */
export function BoardScreen({
  projectId,
  userId,
  onBack,
}: {
  projectId: string;
  userId: string;
  onBack: () => void;
}) {
  const board = useBoard(projectId, userId);
  const moveTask = useMoveTask(projectId, userId);
  const boardEvents = useBoardEvents(projectId, userId);
  const [dialog, setDialog] = useState<TaskDialogState>(null);

  const backButton = (
    <Button variant="outline" onClick={onBack}>
      Volver
    </Button>
  );

  if (board.isPending) {
    return (
      <div className="w-full space-y-4">
        <div className="flex items-center gap-3">
          {backButton}
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          <Skeleton className="h-64 w-72 shrink-0" />
          <Skeleton className="h-64 w-72 shrink-0" />
          <Skeleton className="h-64 w-72 shrink-0" />
        </div>
      </div>
    );
  }

  // Solo sin datos en caché: si falla un refetch (p. ej. tras un rollback con
  // la API caída), se sigue pintando el último tablero bueno.
  if (board.data === undefined) {
    const notFound = board.error instanceof BoardNotFoundError;

    return (
      <div className="w-full space-y-4">
        <div className="flex items-center gap-3">{backButton}</div>
        {notFound ? (
          <p role="alert" className="text-sm text-muted-foreground">
            Proyecto no encontrado
          </p>
        ) : (
          <div role="alert" className="space-y-3">
            <p className="text-sm text-destructive">No se pudo cargar el tablero</p>
            <Button variant="outline" onClick={() => void board.refetch()}>
              Reintentar
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center gap-3">
        {backButton}
        <h1 className="text-xl font-semibold break-words">{board.data.project.name}</h1>
      </div>
      {board.isError ? (
        <p role="alert" className="text-sm text-destructive">
          No se pudo actualizar el tablero; se muestra la última versión.
        </p>
      ) : null}
      <KanbanBoard
        board={board.data}
        onCreateTask={(columnId) => setDialog({ mode: "create", columnId })}
        onEditTask={(task: Task) => setDialog({ mode: "edit", task })}
        onMoveTask={(move) => moveTask.mutate(move)}
        onDraggingChange={boardEvents.setDragging}
      />
      <TaskFormDialog
        projectId={projectId}
        userId={userId}
        state={dialog}
        onClose={() => setDialog(null)}
      />
    </div>
  );
}
