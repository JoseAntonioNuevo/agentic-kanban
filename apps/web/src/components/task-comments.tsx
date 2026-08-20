/**
 * Hilo de comentarios del diálogo de editar. Fuera del <form> de la tarjeta.
 */
import { Button } from "@/components/ui/button.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { useComments, useCreateComment } from "@/hooks/use-comments.ts";
import { useState } from "react";

export function TaskComments({
  taskId,
  userId,
  open,
}: {
  taskId: string;
  userId: string | undefined;
  open: boolean;
}) {
  const comments = useComments(taskId, userId, open);
  const createComment = useCreateComment(taskId, userId);
  const [draft, setDraft] = useState("");

  async function handleComment() {
    const body = draft.trim();
    if (!body) {
      return;
    }
    await createComment.mutateAsync(body);
    setDraft("");
  }

  return (
    <div className="grid gap-3">
      <h3 className="text-sm font-medium">Comentarios</h3>
      {comments.isPending ? (
        <p className="text-sm text-muted-foreground">Cargando comentarios…</p>
      ) : comments.isError ? (
        <p className="text-sm text-destructive">No se pudieron cargar los comentarios.</p>
      ) : comments.data.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aún no hay comentarios.</p>
      ) : (
        <ul className="max-h-48 space-y-3 overflow-y-auto">
          {comments.data.map((comment) => (
            <li key={comment.id} className="space-y-1">
              <p className="flex flex-wrap items-baseline gap-x-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{comment.authorName}</span>
                <time dateTime={comment.createdAt}>
                  {new Date(comment.createdAt).toLocaleString("es", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </time>
              </p>
              <p className="whitespace-pre-wrap text-sm">{comment.body}</p>
            </li>
          ))}
        </ul>
      )}
      <div className="space-y-2">
        <Label htmlFor="task-comment-body">Nuevo comentario</Label>
        <Textarea
          id="task-comment-body"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={3}
          placeholder="Escribe un comentario"
        />
      </div>
      <div className="flex justify-end">
        <Button
          type="button"
          disabled={createComment.isPending || !draft.trim()}
          onClick={() => {
            void handleComment();
          }}
        >
          {createComment.isPending ? "Publicando…" : "Comentar"}
        </Button>
      </div>
    </div>
  );
}
