import type { Notification } from "@agentic-kanban/schemas";
import { describe, expect, it } from "vite-plus/test";

import { bellState } from "./notification-bell-state.ts";

const row = (id: string, readAt: string | null): Notification => ({
  id,
  kind: "mention",
  actorName: "Ana",
  taskId: "t_1",
  taskTitle: "Revisar PR",
  projectId: "p_1",
  commentPreview: "@Luis mira esto",
  createdAt: "2026-01-01T00:00:00.000Z",
  readAt,
});

describe("bellState", () => {
  it("pending → loading", () => {
    expect(bellState({ status: "pending" })).toEqual({ kind: "loading" });
  });

  it("error → error, incluso sin datos (nunca bandeja vacía)", () => {
    expect(bellState({ status: "error" })).toEqual({ kind: "error" });
  });

  it("error con [] en caché sigue siendo error, nunca bandeja vacía", () => {
    expect(bellState({ status: "error", data: [] })).toEqual({ kind: "error" });
  });

  it("error con filas en caché → lista marcada como desactualizada", () => {
    const data = [row("n_1", null)];
    expect(bellState({ status: "error", data })).toEqual({ kind: "list", unread: 1, stale: true });
  });

  it("success con [] → empty", () => {
    expect(bellState({ status: "success", data: [] })).toEqual({ kind: "empty" });
  });

  it("success con filas → list con las no leídas", () => {
    const data = [row("n_1", null), row("n_2", "2026-01-02T00:00:00.000Z"), row("n_3", null)];
    expect(bellState({ status: "success", data })).toEqual({
      kind: "list",
      unread: 2,
      stale: false,
    });
  });

  it("success con todo leído → list con unread 0", () => {
    const data = [row("n_1", "2026-01-02T00:00:00.000Z")];
    expect(bellState({ status: "success", data })).toEqual({
      kind: "list",
      unread: 0,
      stale: false,
    });
  });
});
