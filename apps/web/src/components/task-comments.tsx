/**
 * Hilo de comentarios de una tarea (solo en el diálogo de editar).
 *
 * El hilo es estado de servidor (TanStack Query). El único estado local es el
 * texto del comentario nuevo. El cuerpo se pinta como texto plano, con saltos
 * de línea (`whitespace-pre-wrap`), nunca como HTML. Las menciones no existen
 * todavía: aquí solo se deja un comentario.
 */
import { createCommentBodySchema } from "@agentic-kanban/schemas";
import { useState } from "react";

import { Button } from "@/components/ui/button.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { useComments, useCreateComment } from "@/hooks/use-comments.ts";

export function TaskComments({ taskId, userId }: { taskId: string; userId: string }) {
  const comments = useComments(taskId, userId);
  const createComment = useCreateComment(taskId, userId);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const pending = createComment.isPending;
  const empty = text.trim().length === 0;

  function handleComment() {
    setError(null);
    const parsed = createCommentBodySchema.safeParse({ body: text });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Comentario no válido");
      return;
    }
    createComment.mutate(parsed.data, {
      onSuccess: () => setText(""),
      onError: (cause) => setError(cause.message || "No se pudo crear el comentario"),
    });
  }

  return (
    <section aria-labelledby="task-comments-title" className="space-y-3">
      <h3 id="task-comments-title" className="text-sm font-medium">
        Comentarios
      </h3>
      {comments.isPending ? (
        <div className="space-y-2" aria-label="Cargando comentarios">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : comments.isError ? (
        <p role="alert" className="text-sm text-destructive">
          {comments.error.message || "No se pudieron cargar los comentarios"}
        </p>
      ) : comments.data.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin comentarios</p>
      ) : (
        <ul className="max-h-60 space-y-3 overflow-y-auto">
          {comments.data.map((comment) => (
            <li key={comment.id} className="space-y-1 rounded-md border p-2 text-sm">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-medium">{comment.authorName}</span>
                <time dateTime={comment.createdAt} className="text-xs text-muted-foreground">
                  {new Date(comment.createdAt).toLocaleString("es-ES")}
                </time>
              </div>
              <p className="whitespace-pre-wrap break-words">{comment.body}</p>
            </li>
          ))}
        </ul>
      )}
      <div className="space-y-2">
        <Label htmlFor="task-comment-body">Nuevo comentario</Label>
        <Textarea
          id="task-comment-body"
          value={text}
          maxLength={2000}
          onChange={(event) => setText(event.target.value)}
        />
      </div>
      {error !== null ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <div className="flex justify-end">
        <Button type="button" disabled={empty || pending} onClick={handleComment}>
          {pending ? "Comentando…" : "Comentar"}
        </Button>
      </div>
    </section>
  );
}
