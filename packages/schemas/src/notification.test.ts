/**
 * Prueba los contratos de notificaciones: parses válidos y rechazos.
 * Los tests de Vite+ se importan desde `vite-plus/test`, no desde Vitest.
 */
import { describe, expect, it } from "vite-plus/test";

import {
  notificationIdParamSchema,
  notificationListResponseSchema,
  notificationSchema,
} from "./notification.ts";

const now = new Date().toISOString();

const validNotification = {
  id: "notification-1",
  kind: "mention" as const,
  actorName: "Ada Lovelace",
  taskId: "task-1",
  taskTitle: "Diseñar el tablero",
  projectId: "project-1",
  commentPreview: "Hola @grace, ¿lo revisas?",
  createdAt: now,
  readAt: null,
};

describe("notificationSchema", () => {
  it("acepta una notificación sin leer", () => {
    expect(notificationSchema.parse(validNotification)).toEqual(validNotification);
  });

  it("acepta readAt con fecha ISO", () => {
    const read = { ...validNotification, readAt: new Date().toISOString() };
    expect(notificationSchema.parse(read)).toEqual(read);
  });

  it("acepta un commentPreview vacío", () => {
    expect(notificationSchema.safeParse({ ...validNotification, commentPreview: "" }).success).toBe(
      true,
    );
  });

  it("rechaza un kind distinto de mention", () => {
    expect(notificationSchema.safeParse({ ...validNotification, kind: "assigned" }).success).toBe(
      false,
    );
  });

  it("rechaza un readAt que no es ISO", () => {
    expect(
      notificationSchema.safeParse({ ...validNotification, readAt: "16/10/2026" }).success,
    ).toBe(false);
  });

  it("rechaza una notificación sin taskTitle", () => {
    const { taskTitle: _taskTitle, ...withoutTitle } = validNotification;
    expect(notificationSchema.safeParse(withoutTitle).success).toBe(false);
  });
});

describe("notificationListResponseSchema", () => {
  it("acepta una lista vacía", () => {
    expect(notificationListResponseSchema.parse([])).toEqual([]);
  });

  it("acepta una lista de notificaciones", () => {
    expect(notificationListResponseSchema.parse([validNotification])).toEqual([validNotification]);
  });
});

describe("notificationIdParamSchema", () => {
  it("acepta un id y rechaza uno vacío", () => {
    expect(notificationIdParamSchema.parse({ notificationId: "n-1" })).toEqual({
      notificationId: "n-1",
    });
    expect(notificationIdParamSchema.safeParse({ notificationId: "" }).success).toBe(false);
  });
});
