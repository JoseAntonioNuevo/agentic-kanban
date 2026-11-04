/**
 * Hilo de comentarios de una tarea dentro del diálogo de editar.
 *
 * La lista sale de TanStack Query (`useComments`) y no se copia a estado.
 * El estado local es solo el texto del comentario nuevo y el error de envío.
 * **Comentar** es `type="button"` y vive fuera del `<form>` de la tarea:
 * nunca dispara el `PATCH` de **Guardar**.
 */
import { createCommentBodySchema, type Comment } from "@agentic-kanban/schemas";
import { useState } from "react";

import { Button } from "@/components/ui/button.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { useComments, useCreateComment } from "@/hooks/use-comments.ts";

const dateFormat = new Intl.DateTimeFormat("es-ES", { dateStyle: "short", timeStyle: "short" });

/** Lista y alta de comentarios de `taskId` para `userId`. */
export function TaskComments({ taskId, userId }: { taskId: string; userId: string }) {
  const comments = useComments(taskId, userId);
  const createComment = useCreateComment(taskId, userId);
  const [draft, setDraft] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const sending = createComment.isPending;
  const canSend = !sending && draft.trim() !== "";

  async function handleComment() {
    if (sending) return;
    setSubmitError(null);
    const parsed = createCommentBodySchema.safeParse({ body: draft });
    if (!parsed.success) {
      setSubmitError("El comentario debe tener entre 1 y 2000 caracteres.");
      return;
    }
    try {
      await createComment.mutateAsync(parsed.data);
      setDraft("");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "No se pudo publicar el comentario.");
    }
  }

  return (
    <section className="flex flex-col gap-3" aria-labelledby="task-comments-heading">
      <h3 id="task-comments-heading" className="text-sm font-medium">
        Comentarios
      </h3>
      {comments.isPending ? (
        <div className="flex flex-col gap-2" aria-busy="true">
          <p className="sr-only">Cargando comentarios…</p>
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : comments.data === undefined ? (
        <div className="flex flex-col items-start gap-2" role="alert">
          <p className="text-sm text-destructive">No se pudieron cargar los comentarios.</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              void comments.refetch();
            }}
          >
            Reintentar
          </Button>
        </div>
      ) : comments.data.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todavía no hay comentarios.</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {comments.data.map((comment) => (
            <CommentRow key={comment.id} comment={comment} />
          ))}
        </ol>
      )}
      <div className="flex flex-col gap-2">
        <Label htmlFor="task-comment-body">Nuevo comentario</Label>
        <Textarea
          id="task-comment-body"
          value={draft}
          maxLength={2000}
          disabled={sending}
          onChange={(event) => {
            setDraft(event.target.value);
            setSubmitError(null);
          }}
        />
        {submitError ? (
          <p className="text-sm text-destructive" role="alert">
            {submitError}
          </p>
        ) : null}
        <div className="flex justify-end">
          <Button
            type="button"
            variant="secondary"
            disabled={!canSend}
            onClick={() => {
              void handleComment();
            }}
          >
            {sending ? "Comentando…" : "Comentar"}
          </Button>
        </div>
      </div>
    </section>
  );
}

/** Una fila: autor, fecha y el texto como texto plano. */
function CommentRow({ comment }: { comment: Comment }) {
  return (
    <li className="rounded-md border bg-muted/40 px-3 py-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{comment.authorName}</span>
        <time dateTime={comment.createdAt}>{dateFormat.format(new Date(comment.createdAt))}</time>
      </div>
      <p className="mt-1 text-sm break-words whitespace-pre-wrap">{comment.body}</p>
    </li>
  );
}
