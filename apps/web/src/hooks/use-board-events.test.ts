/**
 * Skip-self: toast solo si el actor no soy yo. comment.created invalida
 * comentarios y campana también para el actor (otra pestaña).
 */
import type { Board, BoardEvent, Task } from "@agentic-kanban/schemas";
import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vite-plus/test";

import { boardQueryKey } from "./use-board.ts";
import { commentsQueryKey } from "./use-comments.ts";
import { handleIncomingBoardEvent } from "./use-board-events.ts";
import { notificationsQueryKey } from "./use-notifications.ts";

const createdAt = "2026-08-20T15:00:00.000Z";
const projectId = "proj_1";
const userId = "user_ana";

const task: Task = {
  id: "t1",
  workspaceId: "ws_1",
  projectId,
  columnId: "col_a",
  title: "Uno",
  description: "",
  position: 0,
  createdAt,
};

const board: Board = {
  project: {
    id: projectId,
    workspaceId: "ws_1",
    name: "Board",
    createdAt,
  },
  columns: [
    {
      id: "col_a",
      workspaceId: "ws_1",
      projectId,
      name: "A",
      position: 0,
      createdAt,
      tasks: [task],
    },
    {
      id: "col_b",
      workspaceId: "ws_1",
      projectId,
      name: "B",
      position: 1,
      createdAt,
      tasks: [],
    },
  ],
};

const commentCreated: BoardEvent = {
  type: "comment.created",
  projectId,
  actorUserId: userId,
  comment: {
    id: "comment_1",
    workspaceId: "ws_1",
    projectId,
    taskId: "t1",
    authorId: userId,
    authorName: "Ana",
    body: "@Luis mira esto",
    createdAt,
  },
};

function setupClient() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  queryClient.setQueryData(boardQueryKey(projectId, userId), board);
  queryClient.setQueryData(commentsQueryKey("t1", userId), []);
  queryClient.setQueryData(notificationsQueryKey(userId), []);
  const toasts: string[] = [];
  return {
    queryClient,
    toasts,
    apply(event: BoardEvent) {
      handleIncomingBoardEvent(event, {
        userId,
        projectId,
        queryClient,
        notify: (message) => {
          toasts.push(message);
        },
      });
    },
  };
}

describe("handleIncomingBoardEvent", () => {
  it("comment.created propio: invalida hilo y campana, sin toast", () => {
    const client = setupClient();

    client.apply(commentCreated);

    expect(client.toasts).toEqual([]);
    expect(client.queryClient.getQueryState(commentsQueryKey("t1", userId))?.isInvalidated).toBe(
      true,
    );
    expect(client.queryClient.getQueryState(notificationsQueryKey(userId))?.isInvalidated).toBe(
      true,
    );
    expect(client.queryClient.getQueryData(boardQueryKey(projectId, userId))).toEqual(board);
  });

  it("comment.created de otro: toast e invalida", () => {
    const client = setupClient();

    client.apply({ ...commentCreated, actorUserId: "user_luis" });

    expect(client.toasts).toEqual(["Nuevo comentario de Ana"]);
    expect(client.queryClient.getQueryState(commentsQueryKey("t1", userId))?.isInvalidated).toBe(
      true,
    );
    expect(client.queryClient.getQueryState(notificationsQueryKey(userId))?.isInvalidated).toBe(
      true,
    );
  });

  it("task.moved propio: aplica cache y no tostea", () => {
    const client = setupClient();
    const moved: BoardEvent = {
      type: "task.moved",
      projectId,
      actorUserId: userId,
      taskId: "t1",
      columnId: "col_b",
      position: 0,
    };

    client.apply(moved);

    expect(client.toasts).toEqual([]);
    const next = client.queryClient.getQueryData<Board>(boardQueryKey(projectId, userId));
    expect(next?.columns[0]?.tasks).toEqual([]);
    expect(next?.columns[1]?.tasks.map((item) => item.id)).toEqual(["t1"]);
  });
});
