/**
 * Parse válido y rechazo de los contratos de notificación.
 */
import { describe, expect, it } from "vite-plus/test";

import {
  notificationIdParamSchema,
  notificationListResponseSchema,
  notificationSchema,
} from "./notification.ts";

const createdAt = "2026-08-20T12:00:00.000Z";

const notification = {
  id: "notification_1",
  workspaceId: "ws_1",
  actorUserId: "user_ana",
  actorName: "Ana",
  taskId: "task_1",
  taskTitle: "Tarea compartida",
  commentId: "comment_1",
  kind: "mention" as const,
  bodyPreview: "@Luis mira esto",
  readAt: null,
  createdAt,
};

describe("notificationSchema", () => {
  it("acepta una mención no leída", () => {
    expect(notificationSchema.parse(notification)).toEqual(notification);
  });

  it("acepta readAt iso datetime", () => {
    const read = { ...notification, readAt: createdAt };
    expect(notificationSchema.parse(read)).toEqual(read);
  });

  it("rechaza un kind que no es mention", () => {
    expect(() => notificationSchema.parse({ ...notification, kind: "email" })).toThrow();
  });

  it("rechaza createdAt que no es iso datetime", () => {
    expect(() => notificationSchema.parse({ ...notification, createdAt: "ayer" })).toThrow();
  });

  it("rechaza readAt que no es iso datetime", () => {
    expect(() => notificationSchema.parse({ ...notification, readAt: "ayer" })).toThrow();
  });
});

describe("notificationListResponseSchema", () => {
  it("acepta una lista vacía", () => {
    expect(notificationListResponseSchema.parse([])).toEqual([]);
  });
});

describe("notificationIdParamSchema", () => {
  it("rechaza un id vacío", () => {
    expect(() => notificationIdParamSchema.parse({ notificationId: "" })).toThrow();
  });
});
