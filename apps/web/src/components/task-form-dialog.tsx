/**
 * Un solo diálogo para crear y editar una tarea.
 *
 * El texto vive en estado local. El board no se copia: en modo editar la
 * tarea llega por props desde la query. La Sesión 4 añadirá los comentarios
 * en el modo editar.
 */
import { createTaskBodySchema, updateTaskBodySchema, type Task } from "@agentic-kanban/schemas";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
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
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { useTaskMutations } from "@/hooks/use-task-mutations.ts";

type TaskFormDialogProps = {
  projectId: string;
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
} & (
  | { mode: "create"; columnId: string; task?: undefined }
  | { mode: "edit"; task: Task; columnId?: undefined }
);

/** Diálogo de alta o edición. `columnId` solo existe al crear. */
export function TaskFormDialog(props: TaskFormDialogProps) {
  const { projectId, userId, open, onOpenChange } = props;
  const mutations = useTaskMutations(projectId, userId);
  const pending =
    mutations.createTask.isPending ||
    mutations.updateTask.isPending ||
    mutations.deleteTask.isPending;
  const [title, setTitle] = useState(props.mode === "edit" ? props.task.title : "");
  const [description, setDescription] = useState(
    props.mode === "edit" ? props.task.description : "",
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const heading = props.mode === "create" ? "Nueva tarea" : "Editar tarea";

  function handleOpenChange(next: boolean) {
    if (!next && pending) return;
    onOpenChange(next);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setFormError(null);

    if (props.mode === "create") {
      const parsed = createTaskBodySchema.safeParse({
        columnId: props.columnId,
        title,
        description,
      });
      if (!parsed.success) {
        setFormError(formErrorMessage(parsed.error));
        return;
      }
      try {
        await mutations.createTask.mutateAsync(parsed.data);
        onOpenChange(false);
      } catch (error) {
        setFormError(error instanceof Error ? error.message : "No se pudo crear la tarea.");
      }
      return;
    }

    const parsed = updateTaskBodySchema.safeParse({ title, description });
    if (!parsed.success) {
      setFormError(formErrorMessage(parsed.error));
      return;
    }
    try {
      await mutations.updateTask.mutateAsync({ taskId: props.task.id, ...parsed.data });
      onOpenChange(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "No se pudo editar la tarea.");
    }
  }

  async function handleDelete() {
    if (props.mode !== "edit" || mutations.deleteTask.isPending) return;
    setFormError(null);
    try {
      await mutations.deleteTask.mutateAsync(props.task.id);
      setConfirmDelete(false);
      onOpenChange(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "No se pudo borrar la tarea.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{heading}</DialogTitle>
          <DialogDescription>
            {props.mode === "create"
              ? "La tarea se añade al final de la columna."
              : "Cambia el título o la descripción."}
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          noValidate
          onSubmit={(event) => void handleSubmit(event)}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="task-title">Título</Label>
            <Input
              id="task-title"
              value={title}
              maxLength={200}
              disabled={pending}
              onChange={(event) => {
                setTitle(event.target.value);
                setFormError(null);
              }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="task-description">Descripción</Label>
            <Textarea
              id="task-description"
              value={description}
              maxLength={5000}
              disabled={pending}
              onChange={(event) => {
                setDescription(event.target.value);
                setFormError(null);
              }}
            />
          </div>
          {formError ? (
            <p className="text-sm text-destructive" role="alert">
              {formError}
            </p>
          ) : null}
          <DialogFooter className={props.mode === "edit" ? "sm:justify-between" : undefined}>
            {props.mode === "edit" ? (
              <Button
                type="button"
                variant="destructive"
                disabled={pending}
                onClick={() => {
                  setFormError(null);
                  setConfirmDelete(true);
                }}
              >
                Borrar
              </Button>
            ) : null}
            <Button type="submit" disabled={pending}>
              {mutations.createTask.isPending || mutations.updateTask.isPending
                ? "Guardando…"
                : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
        {props.mode === "edit" ? (
          <AlertDialog
            open={confirmDelete}
            onOpenChange={(next) => {
              if (!next && mutations.deleteTask.isPending) return;
              setConfirmDelete(next);
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Borrar tarea</AlertDialogTitle>
                <AlertDialogDescription>
                  Se eliminará «{props.task.title}». Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              {formError && confirmDelete ? (
                <p className="text-sm text-destructive" role="alert">
                  {formError}
                </p>
              ) : null}
              <AlertDialogFooter>
                <AlertDialogCancel disabled={mutations.deleteTask.isPending}>
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  disabled={mutations.deleteTask.isPending}
                  onClick={(event) => {
                    event.preventDefault();
                    void handleDelete();
                  }}
                >
                  {mutations.deleteTask.isPending ? "Borrando…" : "Borrar"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function formErrorMessage(error: {
  issues: readonly { path: readonly PropertyKey[]; message: string }[];
}): string {
  const issue = error.issues[0];
  if (!issue) return "Revisa los datos del formulario.";
  if (issue.path[0] === "title") return "El título es obligatorio (máximo 200 caracteres).";
  if (issue.path[0] === "description") return "La descripción admite como máximo 5000 caracteres.";
  return issue.message;
}
