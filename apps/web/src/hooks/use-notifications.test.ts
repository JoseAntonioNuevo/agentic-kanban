/**
 * Contrato de la campana en el cliente: clave, URL, método y parse.
 * El `fetch` global se sustituye y se restaura; no hay navegador.
 */
import { NOTIFICATION_PAGE_SIZE } from "@agentic-kanban/schemas";
import { ZodError } from "zod";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";

import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  nextNotificationCursor,
  notificationListQueryKey,
  notificationsQueryKey,
  replaceNotification,
  unreadCountQueryKey,
} from "./use-notifications.ts";

const unread = {
  id: "notification_1",
  kind: "mention",
  actorName: "Ana",
  taskId: "task_kanban_1",
  taskTitle: "Definir el contrato",
  projectId: "proj_agentic_kanban",
  commentPreview: "@Luis mira esto",
  createdAt: "2026-11-04T10:00:00.000Z",
  readAt: null,
} as const;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("claves", () => {
  it("el prefijo es [notifications, userId] y cubre bandeja y contador", () => {
    expect(notificationsQueryKey("user_luis")).toEqual(["notifications", "user_luis"]);
    expect(notificationListQueryKey("user_luis")).toEqual(["notifications", "user_luis", "list"]);
    expect(unreadCountQueryKey("user_luis")).toEqual([
      "notifications",
      "user_luis",
      "unread-count",
    ]);
  });
});

describe("fetchNotifications", () => {
  it("hace GET relativo con la cookie y parsea la lista, también []", async () => {
    const fetchMock = vi.fn(async () => jsonResponse([unread]));
    vi.stubGlobal("fetch", fetchMock);
    await expect(fetchNotifications()).resolves.toEqual([unread]);
    expect(fetchMock).toHaveBeenCalledWith("/api/notifications", {
      credentials: "include",
      signal: undefined,
    });

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse([])),
    );
    await expect(fetchNotifications()).resolves.toEqual([]);
  });

  it("un HTTP no ok lanza Error y un cuerpo inválido ZodError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ error: "Unauthorized" }, 401)),
    );
    await expect(fetchNotifications()).rejects.toThrow("401");

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse([{ ...unread, createdAt: 1 }])),
    );
    await expect(fetchNotifications()).rejects.toBeInstanceOf(ZodError);
  });
});

describe("markNotificationRead", () => {
  it("hace POST a /read y parsea la notificación", async () => {
    const read = { ...unread, readAt: "2026-11-04T10:05:00.000Z" };
    const fetchMock = vi.fn(async () => jsonResponse(read));
    vi.stubGlobal("fetch", fetchMock);

    await expect(markNotificationRead("notification/1")).resolves.toEqual(read);
    expect(fetchMock).toHaveBeenCalledWith("/api/notifications/notification%2F1/read", {
      method: "POST",
      credentials: "include",
    });
  });

  it("un 404 lanza Error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ error: "Not found" }, 404)),
    );
    await expect(markNotificationRead("notification_1")).rejects.toThrow("404");
  });
});

describe("fetchNotifications con cursor", () => {
  it("manda before codificado en la query", async () => {
    const fetchMock = vi.fn(async () => jsonResponse([]));
    vi.stubGlobal("fetch", fetchMock);
    await fetchNotifications({ before: "2026-11-04T10:00:00.000Z|n_1" });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/notifications?before=2026-11-04T10%3A00%3A00.000Z%7Cn_1",
      { credentials: "include", signal: undefined },
    );
  });
});

describe("nextNotificationCursor", () => {
  it("solo hay página siguiente si la última vino llena", () => {
    expect(nextNotificationCursor([])).toBeUndefined();
    expect(nextNotificationCursor([unread])).toBeUndefined();
    const full = Array.from({ length: NOTIFICATION_PAGE_SIZE }, (_, index) => ({
      ...unread,
      id: `n_${index}`,
    }));
    expect(nextNotificationCursor(full)).toBe(
      `${unread.createdAt}|n_${NOTIFICATION_PAGE_SIZE - 1}`,
    );
  });
});

describe("fetchUnreadNotificationCount", () => {
  it("hace GET y devuelve el número; un HTTP no ok o un cuerpo inválido lanzan", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ count: 2000 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(fetchUnreadNotificationCount()).resolves.toBe(2000);
    expect(fetchMock).toHaveBeenCalledWith("/api/notifications/unread-count", {
      credentials: "include",
      signal: undefined,
    });

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ error: "Unauthorized" }, 401)),
    );
    await expect(fetchUnreadNotificationCount()).rejects.toThrow("401");

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ count: "2000" })),
    );
    await expect(fetchUnreadNotificationCount()).rejects.toBeInstanceOf(ZodError);
  });
});

describe("markAllNotificationsRead", () => {
  it("hace POST a /read-all y parsea { updated }", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ updated: 3 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(markAllNotificationsRead()).resolves.toEqual({ updated: 3 });
    expect(fetchMock).toHaveBeenCalledWith("/api/notifications/read-all", {
      method: "POST",
      credentials: "include",
    });

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ error: "Unauthorized" }, 401)),
    );
    await expect(markAllNotificationsRead()).rejects.toThrow("401");
  });
});

describe("replaceNotification", () => {
  it("sustituye la fila con el mismo id en cualquier página sin mutar la caché", () => {
    const other = { ...unread, id: "notification_2" };
    const data = { pages: [[other], [unread]], pageParams: [undefined, "cursor"] };
    const read = { ...unread, readAt: "2026-11-04T10:05:00.000Z" };

    expect(replaceNotification(data, read)).toEqual({
      pages: [[other], [read]],
      pageParams: [undefined, "cursor"],
    });
    expect(data.pages[1]).toEqual([unread]);
    expect(replaceNotification(undefined, read)).toBeUndefined();
    expect(replaceNotification(data, { ...read, id: "otra" })).toBe(data);
  });
});
