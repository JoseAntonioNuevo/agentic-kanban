/**
 * Crear o editar título y descripción. Estado local del form, no del board.
 * El hilo de comentarios solo se pinta en editar (props opcionales).
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
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import type { Comment } from "@agentic-kanban/schemas";
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
  comments?: Comment[];
  commentsPending?: boolean;
  commentsError?: boolean;
  onCreateComment?: (body: string) => Promise<void>;
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
  comments,
  commentsPending,
  commentsError,
  onCreateComment,
}: TaskFormDialogProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [submitting, setSubmitting] = useState(false);
  const [commentBody, setCommentBody] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);

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
        className={
          onCreateComment ? "max-h-[min(90dvh,40rem)] overflow-y-auto sm:max-w-md" : "sm:max-w-md"
        }
        onOpenAutoFocus={() => {
          setTitle(initialTitle);
          setDescription(initialDescription);
          setCommentBody("");
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
          {onCreateComment ? (
            <div className="space-y-3">
              <p className="text-sm font-medium">Comentarios</p>
              {commentsPending ? (
                <Skeleton className="h-16 w-full" />
              ) : commentsError ? (
                <p className="text-sm text-destructive">No se pudieron cargar los comentarios.</p>
              ) : !comments?.length ? (
                <p className="text-sm text-muted-foreground">Aún no hay comentarios.</p>
              ) : (
                <ul className="max-h-48 space-y-3 overflow-y-auto">
                  {comments.map((comment) => (
                    <li key={comment.id} className="space-y-1">
                      <p className="text-sm font-medium">{comment.authorName}</p>
                      <p className="text-sm whitespace-pre-wrap">{comment.body}</p>
                    </li>
                  ))}
                </ul>
              )}
              <div className="space-y-2">
                <Label htmlFor="task-comment">Nuevo comentario</Label>
                <Textarea
                  id="task-comment"
                  value={commentBody}
                  onChange={(event) => setCommentBody(event.target.value)}
                  rows={3}
                />
                <Button
                  type="button"
                  disabled={commentSubmitting || !commentBody.trim()}
                  onClick={async () => {
                    const body = commentBody.trim();
                    if (!body) {
                      return;
                    }
                    setCommentSubmitting(true);
                    try {
                      await onCreateComment(body);
                      setCommentBody("");
                    } finally {
                      setCommentSubmitting(false);
                    }
                  }}
                >
                  {commentSubmitting ? "Publicando…" : "Comentar"}
                </Button>
              </div>
            </div>
          ) : null}
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
