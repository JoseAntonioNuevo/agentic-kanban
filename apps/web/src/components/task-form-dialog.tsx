/**
 * Crear o editar título y descripción. Estado local del form, no del board.
 */
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
import { useState } from "react";

type TaskFormDialogProps = {
  open: boolean;
  title: string;
  description: string;
  submitLabel: string;
  heading: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: { title: string; description: string }) => Promise<void>;
  onDelete?: () => void;
};

export function TaskFormDialog({
  open,
  title: initialTitle,
  description: initialDescription,
  submitLabel,
  heading,
  onOpenChange,
  onSubmit,
  onDelete,
}: TaskFormDialogProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [submitting, setSubmitting] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          onOpenChange(false);
        }
      }}
    >
      <DialogContent
        className="sm:max-w-md"
        onOpenAutoFocus={() => {
          setTitle(initialTitle);
          setDescription(initialDescription);
        }}
      >
        <form
          className="grid gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!title.trim()) {
              return;
            }
            setSubmitting(true);
            try {
              await onSubmit({ title: title.trim(), description });
              onOpenChange(false);
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>{heading}</DialogTitle>
            <DialogDescription>El servidor valida y guarda los cambios.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="task-title">Título</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-description">Descripción</Label>
            <Textarea
              id="task-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter className={onDelete ? "sm:justify-between" : undefined}>
            {onDelete ? (
              <Button type="button" variant="destructive" onClick={onDelete}>
                Eliminar
              </Button>
            ) : null}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting || !title.trim()}>
                {submitting ? "Guardando…" : submitLabel}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
