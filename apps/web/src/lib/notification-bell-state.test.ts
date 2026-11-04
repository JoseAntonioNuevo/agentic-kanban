/**
 * Estados de la campana: contador del servidor y bandeja paginada.
 */
import type { Notification } from "@agentic-kanban/schemas";
import { describe, expect, it } from "vite-plus/test";

import { notificationListState, unreadBadgeLabel, unreadState } from "./notification-bell-state.ts";

const unread: Notification = {
  id: "notification_1",
  kind: "mention",
  actorName: "Ana",
  taskId: "task_kanban_1",
  taskTitle: "Definir el contrato",
  projectId: "proj_agentic_kanban",
  commentPreview: "@Luis mira esto",
  createdAt: "2026-11-04T10:00:00.000Z",
  readAt: null,
};
const read: Notification = { ...unread, id: "notification_2", readAt: "2026-11-04T10:05:00.000Z" };

describe("unreadState y unreadBadgeLabel", () => {
  it("solo hay contador si la consulta fue bien", () => {
    expect(unreadState({ status: "pending", data: undefined })).toEqual({ kind: "unknown" });
    expect(unreadState({ status: "error", data: 3 })).toEqual({ kind: "unknown" });
    expect(unreadState({ status: "success", data: 0 })).toEqual({ kind: "known", count: 0 });
  });

  it("el badge usa el contador del servidor, no las filas cargadas", () => {
    expect(unreadBadgeLabel({ kind: "unknown" })).toBeUndefined();
    expect(unreadBadgeLabel({ kind: "known", count: 0 })).toBeUndefined();
    expect(unreadBadgeLabel({ kind: "known", count: 7 })).toBe("7");
    expect(unreadBadgeLabel({ kind: "known", count: 2000 })).toBe("99+");
  });
});

describe("notificationListState", () => {
  it("pending es loading", () => {
    expect(
      notificationListState({ status: "pending", pages: undefined, hasNextPage: false }),
    ).toEqual({ kind: "loading" });
  });

  it("un error es error, también con páginas viejas en caché", () => {
    expect(
      notificationListState({ status: "error", pages: undefined, hasNextPage: false }),
    ).toEqual({ kind: "error" });
    expect(notificationListState({ status: "error", pages: [[]], hasNextPage: false })).toEqual({
      kind: "error",
    });
    expect(
      notificationListState({ status: "error", pages: [[unread]], hasNextPage: true }),
    ).toEqual({ kind: "error" });
  });

  it("un éxito sin filas es la bandeja vacía", () => {
    expect(notificationListState({ status: "success", pages: [[]], hasNextPage: false })).toEqual({
      kind: "empty",
    });
  });

  it("aplana las páginas en orden y dice si quedan más", () => {
    expect(
      notificationListState({ status: "success", pages: [[unread], [read]], hasNextPage: true }),
    ).toEqual({ kind: "list", items: [unread, read], hasMore: true });
    expect(
      notificationListState({ status: "success", pages: [[read]], hasNextPage: false }),
    ).toMatchObject({ kind: "list", hasMore: false });
  });
});
