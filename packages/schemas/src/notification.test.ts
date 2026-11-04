/**
 * Contratos de la campana: parse válido, `readAt` nulo y rechazos.
 */
import { describe, expect, it } from "vite-plus/test";

import {
  notificationCursor,
  notificationIdParamSchema,
  notificationListQuerySchema,
  notificationReadAllResponseSchema,
  notificationUnreadCountResponseSchema,
  notificationListResponseSchema,
  notificationSchema,
} from "./notification.ts";

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
};

describe("notificationSchema", () => {
  it("acepta una mención sin leer y una leída", () => {
    expect(notificationSchema.parse(unread)).toEqual(unread);
    const read = { ...unread, readAt: "2026-11-04T10:05:00.000Z" };
    expect(notificationSchema.parse(read)).toEqual(read);
  });

  it("acepta un extracto vacío", () => {
    expect(notificationSchema.parse({ ...unread, commentPreview: "" }).commentPreview).toBe("");
  });

  it("rechaza otro kind, fechas que no son ISO y readAt ausente", () => {
    expect(notificationSchema.safeParse({ ...unread, kind: "comment" }).success).toBe(false);
    expect(notificationSchema.safeParse({ ...unread, createdAt: "ayer" }).success).toBe(false);
    expect(notificationSchema.safeParse({ ...unread, readAt: 1730714400000 }).success).toBe(false);
    const { readAt: _readAt, ...withoutReadAt } = unread;
    expect(notificationSchema.safeParse(withoutReadAt).success).toBe(false);
  });
});

describe("notificationListResponseSchema", () => {
  it("acepta [] y una lista", () => {
    expect(notificationListResponseSchema.parse([])).toEqual([]);
    expect(notificationListResponseSchema.parse([unread])).toEqual([unread]);
  });
});

describe("notificationIdParamSchema", () => {
  it("exige un id no vacío", () => {
    expect(notificationIdParamSchema.parse({ notificationId: "n_1" })).toEqual({
      notificationId: "n_1",
    });
    expect(notificationIdParamSchema.safeParse({ notificationId: "" }).success).toBe(false);
  });
});

describe("notificationListQuerySchema", () => {
  it("sin before es la primera página", () => {
    expect(notificationListQuerySchema.parse({})).toEqual({});
  });

  it("parte el cursor en createdAt e id, también si el id lleva |", () => {
    const cursor = notificationCursor(unread);
    expect(cursor).toBe("2026-11-04T10:00:00.000Z|notification_1");
    expect(notificationListQuerySchema.parse({ before: cursor })).toEqual({
      before: { createdAt: unread.createdAt, id: unread.id },
    });
    expect(
      notificationListQuerySchema.parse({ before: `${unread.createdAt}|a|b` }).before?.id,
    ).toBe("a|b");
  });

  it("rechaza cursores mal formados", () => {
    for (const before of ["", "sin-separador", "ayer|n_1", `${unread.createdAt}|`]) {
      expect(notificationListQuerySchema.safeParse({ before }).success).toBe(false);
    }
  });
});

describe("contador y marcar todas", () => {
  it("aceptan enteros no negativos", () => {
    expect(notificationUnreadCountResponseSchema.parse({ count: 0 })).toEqual({ count: 0 });
    expect(notificationUnreadCountResponseSchema.safeParse({ count: -1 }).success).toBe(false);
    expect(notificationUnreadCountResponseSchema.safeParse({ count: 1.5 }).success).toBe(false);
    expect(notificationReadAllResponseSchema.parse({ updated: 3 })).toEqual({ updated: 3 });
    expect(notificationReadAllResponseSchema.safeParse({}).success).toBe(false);
  });
});
