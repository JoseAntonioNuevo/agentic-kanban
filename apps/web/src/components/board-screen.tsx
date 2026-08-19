/**
 * Pantalla del tablero: query, loading/error, diálogos y columnas.
 */
import { KanbanBoard } from "@/components/kanban-board.tsx";
import { TaskFormDialog } from "@/components/task-form-dialog.tsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { useBoard } from "@/hooks/use-board.ts";
import { useCreateTask, useDeleteTask, useUpdateTask } from "@/hooks/use-task-mutations.ts";
import { authClient } from "@/lib/auth-client.ts";
import type { Task } from "@agentic-kanban/schemas";
import { useState } from "react";

type DialogState =
  | { kind: "closed" }
  | { kind: "create"; columnId: string }
  | { kind: "edit"; task: Task };

export function BoardScreen({
  projectId,
  userId,
  onBack,
}: {
  projectId: string;
  userId: string | undefined;
  onBack: () => void;
}) {
  const board = useBoard(projectId, userId);
  // #region agent log
  fetch("http://127.0.0.1:7647/ingest/ba5bd8d3-f312-4898-9461-0e2daa745a39", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "81244b" },
    body: JSON.stringify({
      sessionId: "81244b",
      hypothesisId: "B",
      location: "board-screen.tsx:render",
      message: "board query state",
      data: {
        projectId,
        isPending: board.isPending,
        isError: board.isError,
        hasData: Boolean(board.data),
        columnCount: board.data?.columns.length ?? null,
        error: board.error instanceof Error ? board.error.message : String(board.error ?? ""),
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  const createTask = useCreateTask(projectId, userId);
  const updateTask = useUpdateTask(projectId, userId);
  const deleteTask = useDeleteTask(projectId, userId);
  const [dialog, setDialog] = useState<DialogState>({ kind: "closed" });
  const [pendingDelete, setPendingDelete] = useState<Task | null>(null);

  if (board.isPending) {
    return (
      <div className="flex min-h-svh flex-col bg-background">
        <header className="flex items-center gap-3 border-b px-4 py-3">
          <Button type="button" variant="outline" size="sm" onClick={onBack}>
            Workspaces
          </Button>
        </header>
        <div className="flex gap-3 overflow-x-auto p-4">
          <Skeleton className="h-64 w-72 shrink-0" />
          <Skeleton className="h-64 w-72 shrink-0" />
          <Skeleton className="h-64 w-72 shrink-0" />
        </div>
      </div>
    );
  }

  if (board.isError || !board.data) {
    return (
      <div className="space-y-3 p-6">
        <p className="text-sm text-destructive">No se pudo cargar el tablero.</p>
        <Button type="button" variant="outline" onClick={onBack}>
          Volver
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <Button type="button" variant="outline" size="sm" onClick={onBack}>
          Workspaces
        </Button>
        <h1 className="flex-1 text-lg font-medium">{board.data.project.name}</h1>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={async () => {
            await authClient.signOut();
            onBack();
          }}
        >
          Cerrar sesión
        </Button>
      </header>

      {board.data.columns.length === 0 ? (
        <p className="p-6 text-sm text-muted-foreground">
          Este proyecto aún no tiene columnas. Vuelve a Workspaces y abre thePower Demo, o
          ejecuta bun run db:seed.
        </p>
      ) : (
        <div className="flex-1 overflow-x-auto p-4">
          <KanbanBoard
            board={board.data}
            userId={userId}
            onCreate={(columnId) => setDialog({ kind: "create", columnId })}
            onEdit={(task) => setDialog({ kind: "edit", task })}
          />
        </div>
      )}

      {dialog.kind === "create" ? (
        <TaskFormDialog
          open
          heading="Nueva tarea"
          submitLabel="Crear"
          title=""
          description=""
          onOpenChange={(open) => {
            if (!open) {
              setDialog({ kind: "closed" });
            }
          }}
          onSubmit={async (values) => {
            if (dialog.kind !== "create") {
              return;
            }
            await createTask.mutateAsync({
              columnId: dialog.columnId,
              title: values.title,
              description: values.description,
            });
          }}
        />
      ) : null}

      {dialog.kind === "edit" ? (
        <TaskFormDialog
          open
          heading="Editar tarea"
          submitLabel="Guardar"
          title={dialog.task.title}
          description={dialog.task.description}
          onOpenChange={(open) => {
            if (!open) {
              setDialog({ kind: "closed" });
            }
          }}
          onSubmit={async (values) => {
            if (dialog.kind !== "edit") {
              return;
            }
            await updateTask.mutateAsync({
              taskId: dialog.task.id,
              body: values,
            });
          }}
          onDelete={() => {
            if (dialog.kind === "edit") {
              setPendingDelete(dialog.task);
            }
          }}
        />
      ) : null}

      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta tarea?</AlertDialogTitle>
            <AlertDialogDescription>
              Se quitará del tablero. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (!pendingDelete) {
                  return;
                }
                const id = pendingDelete.id;
                setPendingDelete(null);
                setDialog({ kind: "closed" });
                void deleteTask.mutateAsync(id);
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
