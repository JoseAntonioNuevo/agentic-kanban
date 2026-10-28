/**
 * Tablero de un proyecto: cabecera, columnas y el diálogo de tareas.
 *
 * El board sale de TanStack Query. El único estado local es qué diálogo
 * está abierto (crear en una columna o editar una tarea por id). Mover
 * escribe en esa caché; no hay una segunda copia del board. Mientras se
 * pinta el tablero, `useBoardEvents` mantiene abierto su canal en vivo.
 */
import { useEffect, useState } from "react";

import { KanbanBoard } from "@/components/kanban-board.tsx";
import { TaskFormDialog } from "@/components/task-form-dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { useBoardEvents } from "@/hooks/use-board-events.ts";
import { BoardNotFoundError, useBoard } from "@/hooks/use-board.ts";
import { useMoveTask } from "@/hooks/use-move-task.ts";

type DialogState = { mode: "create"; columnId: string } | { mode: "edit"; taskId: string } | null;

/** Pantalla del proyecto abierto. `onBack` vuelve al dashboard. */
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
  // Misma condición que la rama que pinta `KanbanBoard`: un 404 nunca abre canal.
  const showsBoard = board.data !== undefined && !(board.error instanceof BoardNotFoundError);
  useBoardEvents(projectId, userId, showsBoard);
  const [dialog, setDialog] = useState<DialogState>(null);

  const editingTask =
    dialog?.mode === "edit"
      ? board.data?.columns
          .flatMap((column) => column.tasks)
          .find((task) => task.id === dialog.taskId)
      : undefined;

  useEffect(() => {
    if (dialog?.mode !== "edit" || board.data === undefined) return;
    const exists = board.data.columns.some((column) =>
      column.tasks.some((task) => task.id === dialog.taskId),
    );
    if (!exists) setDialog(null);
  }, [board.data, dialog]);

  const title =
    board.data !== undefined
      ? board.data.project.name
      : board.error instanceof BoardNotFoundError
        ? "Proyecto no encontrado"
        : "Tablero";

  return (
    <section className="flex w-full flex-col gap-4" aria-busy={board.isPending}>
      <header className="flex items-center gap-3">
        <Button type="button" variant="outline" onClick={onBack}>
          Volver
        </Button>
        {board.isPending && board.data === undefined ? (
          <Skeleton className="h-7 w-48" />
        ) : (
          <h1 className="min-w-0 truncate text-lg font-medium sm:text-xl">{title}</h1>
        )}
      </header>
      {board.isPending && board.data === undefined ? (
        <LoadingBoard />
      ) : board.error instanceof BoardNotFoundError ? (
        <BoardNotFound onBack={onBack} />
      ) : board.data !== undefined ? (
        <KanbanBoard
          board={board.data}
          onCreateTask={(columnId) => {
            setDialog({ mode: "create", columnId });
          }}
          onEditTask={(taskId) => {
            setDialog({ mode: "edit", taskId });
          }}
          onMoveTask={(move) => {
            moveTask.mutate(move);
          }}
        />
      ) : (
        <BoardError
          onRetry={() => {
            void board.refetch();
          }}
        />
      )}
      {dialog?.mode === "create" ? (
        <TaskFormDialog
          key={`create:${dialog.columnId}`}
          projectId={projectId}
          userId={userId}
          mode="create"
          columnId={dialog.columnId}
          open
          onOpenChange={(next) => {
            if (!next) setDialog(null);
          }}
        />
      ) : null}
      {dialog?.mode === "edit" && editingTask ? (
        <TaskFormDialog
          key={`edit:${editingTask.id}`}
          projectId={projectId}
          userId={userId}
          mode="edit"
          task={editingTask}
          open
          onOpenChange={(next) => {
            if (!next) setDialog(null);
          }}
        />
      ) : null}
    </section>
  );
}

/** Tres columnas de marcador mientras llega el tablero. */
function LoadingBoard() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:overflow-x-hidden" aria-busy="true">
      <p className="sr-only">Cargando el tablero…</p>
      <Skeleton className="h-40 w-full shrink-0 sm:h-64 sm:w-72" />
      <Skeleton className="h-40 w-full shrink-0 sm:h-64 sm:w-72" />
      <Skeleton className="h-40 w-full shrink-0 sm:h-64 sm:w-72" />
    </div>
  );
}

/** 404: el proyecto no existe o el usuario no es miembro. */
function BoardNotFound({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-3" role="alert">
      <p className="text-sm">Proyecto no encontrado.</p>
      <Button type="button" variant="outline" onClick={onBack}>
        Volver
      </Button>
    </div>
  );
}

/** Error de red o de contrato, con reintento de la misma query. */
function BoardError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="space-y-3" role="alert">
      <p className="text-sm">No se pudo cargar el tablero.</p>
      <Button type="button" variant="outline" onClick={onRetry}>
        Reintentar
      </Button>
    </div>
  );
}
