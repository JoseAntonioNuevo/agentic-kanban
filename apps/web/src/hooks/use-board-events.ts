/**
 * SSE del project abierto. Un solo EventSource. Parchea / invalida cache
 * y tostea solo eventos de otros usuarios. Se cierra al desmontar.
 * Skip-self es solo el toast: el actor (otra pestaña) sí actualiza cache.
 */
import {
  applyBoardEvent,
  boardEventSchema,
  boardEventToastMessage,
  type Board,
  type BoardEvent,
} from "@agentic-kanban/schemas";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";

import { boardQueryKey } from "./use-board.ts";
import { commentsQueryKey } from "./use-comments.ts";
import { notificationsQueryKey } from "./use-notifications.ts";

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

export function handleIncomingBoardEvent(
  event: BoardEvent,
  options: {
    userId: string;
    projectId: string;
    queryClient: QueryClient;
    notify: (message: string) => void;
  },
): void {
  const { userId, projectId, queryClient, notify } = options;
  const isSelf = event.actorUserId === userId;

  if (event.type === "comment.created") {
    void queryClient.invalidateQueries({
      queryKey: commentsQueryKey(event.comment.taskId, userId),
    });
    void queryClient.invalidateQueries({
      queryKey: notificationsQueryKey(userId),
    });
    if (!isSelf) {
      notify(boardEventToastMessage(event, undefined));
    }
    return;
  }

  const queryKey = boardQueryKey(projectId, userId);
  const title =
    event.type === "task.created" || event.type === "task.updated"
      ? event.task.title
      : taskTitleFromBoard(queryClient.getQueryData<Board>(queryKey), event.taskId);

  if (!isSelf) {
    notify(boardEventToastMessage(event, title));
  }

  queryClient.setQueryData<Board>(queryKey, (current) =>
    current ? applyBoardEvent(current, event) : current,
  );
}

export function useBoardEvents(projectId: string, userId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) {
      return;
    }

    const source = new EventSource(`/api/projects/${projectId}/events`);

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

      handleIncomingBoardEvent(parsed.data, {
        userId,
        projectId,
        queryClient,
        notify: (text) => {
          toast.info(text);
        },
      });
    };

    return () => {
      source.close();
    };
  }, [projectId, queryClient, userId]);
}
