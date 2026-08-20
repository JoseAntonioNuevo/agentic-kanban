/**
 * SSE del project abierto. Parchea la cache de TanStack Query y tostea
 * eventos de otros usuarios. `comment.created` invalida comentarios y
 * notificaciones (no muta el snapshot del board). Se cierra al desmontar.
 * El propio actor no recibe toast (el optimistic ya pintó); sí se aplica
 * la cache para que otra pestaña de la misma cuenta se sincronice.
 * Un solo EventSource.
 */
import {
  applyBoardEvent,
  boardEventSchema,
  boardEventToastMessage,
  type Board,
} from "@agentic-kanban/schemas";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";

import { boardQueryKey } from "@/hooks/use-board.ts";
import { commentsQueryKey } from "@/hooks/use-comments.ts";
import { notificationsQueryKey } from "@/hooks/use-notifications.ts";

function taskTitleFromBoard(board: Board | undefined, taskId: string): string | undefined {
  if (!board) {
    return undefined;
  }

  for (const column of board.columns) {
    const match = column.tasks.find((task) => task.id === taskId);
    if (match) {
      return match.title;
    }
  }

  return undefined;
}

export function useBoardEvents(projectId: string, userId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) {
      return;
    }

    const source = new EventSource(`/api/projects/${projectId}/events`, {
      withCredentials: true,
    });
    const queryKey = boardQueryKey(projectId, userId);

    source.onmessage = (message) => {
      let payload: unknown;
      try {
        payload = JSON.parse(message.data) as unknown;
      } catch {
        return;
      }

      const parsed = boardEventSchema.safeParse(payload);
      if (!parsed.success) {
        return;
      }

      const event = parsed.data;
      const isSelf = event.actorUserId === userId;

      if (event.type === "comment.created") {
        if (!isSelf) {
          toast.info(boardEventToastMessage(event, undefined));
        }
        void queryClient.invalidateQueries({
          queryKey: commentsQueryKey(event.comment.taskId, userId),
        });
        void queryClient.invalidateQueries({
          queryKey: notificationsQueryKey(userId),
        });
        return;
      }

      if (!isSelf) {
        const title =
          event.type === "task.created" || event.type === "task.updated"
            ? event.task.title
            : taskTitleFromBoard(queryClient.getQueryData<Board>(queryKey), event.taskId);

        toast.info(boardEventToastMessage(event, title));
      }

      queryClient.setQueryData<Board>(queryKey, (current) =>
        current ? applyBoardEvent(current, event) : current,
      );
    };

    return () => {
      source.close();
    };
  }, [projectId, queryClient, userId]);
}
