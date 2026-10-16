/**
 * Diálogo único para crear y editar tareas.
 *
 * Abierto cuando `state != null`. El texto del formulario es estado local; el
 * board sigue siendo de TanStack Query (las mutations actualizan su caché).
 * Se valida con los schemas compartidos (`safeParse`) antes de mutar. El
 * botón Guardar se deshabilita mientras la mutation está en curso y los
 * errores se muestran con `role="alert"`. En modo editar hay «Borrar» con
 * confirmación en un AlertDialog.
 *
 * Sesión 4: aquí, en modo editar, se añadirán los comentarios de la tarea.
 */
import { createTaskBodySchema, updateTaskBodySchema, type Task } from "@agentic-kanban/schemas";
import { useState, type FormEvent } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { useTaskMutations } from "@/hooks/use-task-mutations.ts";

/** Estado del diálogo: crear en una columna, editar una tarea o cerrado. */
export type TaskDialogState =
  | { mode: "create"; columnId: string }
  | { mode: "edit"; task: Task }
  | null;

/** Dialog controlado por `state`; el formulario se monta solo con el diálogo abierto. */
export function TaskFormDialog({
  projectId,
  userId,
  state,
  onClose,
}: {
  projectId: string;
  userId: string;
  state: TaskDialogState;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={state !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      {state !== null ? (
        <DialogContent>
          <TaskForm
            // La clave reinicia el texto al abrir otra tarea u otra columna.
            key={state.mode === "edit" ? state.task.id : `create-${state.columnId}`}
            projectId={projectId}
            userId={userId}
            state={state}
            onClose={onClose}
          />
        </DialogContent>
      ) : null}
    </Dialog>
  );
}

/** Formulario interno: título, descripción, guardar y (al editar) borrar. */
function TaskForm({
  projectId,
  userId,
  state,
  onClose,
}: {
  projectId: string;
  userId: string;
  state: Exclude<TaskDialogState, null>;
  onClose: () => void;
}) {
  const { createTask, updateTask, deleteTask } = useTaskMutations(projectId, userId);
  const editing = state.mode === "edit";
  const [title, setTitle] = useState(editing ? state.task.title : "");
  const [description, setDescription] = useState(editing ? state.task.description : "");
  const [error, setError] = useState<string | null>(null);

  const pending = createTask.isPending || updateTask.isPending || deleteTask.isPending;

  /** Muestra el mensaje del error de la mutation en el propio diálogo. */
  function showError(cause: Error) {
    setError(cause.message || "No se pudo completar la operación");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (state.mode === "create") {
      const parsed = createTaskBodySchema.safeParse({
        columnId: state.columnId,
        title,
        description,
      });
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? "Datos no válidos");
        return;
      }
      createTask.mutate(parsed.data, { onSuccess: onClose, onError: showError });
      return;
    }

    const parsed = updateTaskBodySchema.safeParse({ title, description });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Datos no válidos");
      return;
    }
    updateTask.mutate(
      { taskId: state.task.id, patch: parsed.data },
      { onSuccess: onClose, onError: showError },
    );
  }

  function handleDelete() {
    if (state.mode !== "edit") return;
    setError(null);
    deleteTask.mutate({ taskId: state.task.id }, { onSuccess: onClose, onError: showError });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <DialogHeader>
        <DialogTitle>{editing ? "Editar tarea" : "Nueva tarea"}</DialogTitle>
        <DialogDescription>
          {editing
            ? "Cambia el título o la descripción."
            : "Indica el título y, si quieres, una descripción."}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-2">
        <Label htmlFor="task-title">Título</Label>
        <Input
          id="task-title"
          value={title}
          maxLength={200}
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="task-description">Descripción</Label>
        <Textarea
          id="task-description"
          value={description}
          maxLength={5000}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>
      {error !== null ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <DialogFooter>
        {editing ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="destructive" disabled={pending}>
                Borrar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Borrar la tarea?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se borrará «{state.task.title}» y no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={handleDelete}>
                  Borrar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Guardar"}
        </Button>
      </DialogFooter>
    </form>
  );
}
