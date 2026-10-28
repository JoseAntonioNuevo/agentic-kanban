/**
 * Hub en memoria: reparto por project, baja, eventos inválidos y
 * listeners que fallan. Cada test usa projects propios.
 */
import { randomUUID } from "node:crypto";

import type { BoardEvent } from "@agentic-kanban/schemas";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";

import { publish, subscribe } from "./index.ts";

function projectId(label: string): string {
  return `proj_hub_${label}_${randomUUID()}`;
}

function deletedEvent(project: string): BoardEvent {
  return { type: "task.deleted", projectId: project, actorUserId: "user_1", taskId: "task_1" };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("hub de realtime", () => {
  it("entrega a los suscriptores de ese project y no a los de otro", () => {
    const own = projectId("own");
    const other = projectId("other");
    const ownListener = vi.fn();
    const otherListener = vi.fn();
    const unsubscribeOwn = subscribe(own, ownListener);
    const unsubscribeOther = subscribe(other, otherListener);

    const event = deletedEvent(own);
    publish(event);

    expect(ownListener).toHaveBeenCalledTimes(1);
    expect(ownListener).toHaveBeenCalledWith(event);
    expect(otherListener).not.toHaveBeenCalled();

    unsubscribeOwn();
    unsubscribeOther();
  });

  it("deja de entregar tras darse de baja", () => {
    const project = projectId("unsubscribe");
    const listener = vi.fn();
    const unsubscribe = subscribe(project, listener);

    unsubscribe();
    publish(deletedEvent(project));

    expect(listener).not.toHaveBeenCalled();
  });

  it("no hace nada sin suscriptores", () => {
    expect(() => publish(deletedEvent(projectId("empty")))).not.toThrow();
  });

  it("registra un evento inválido sin entregarlo ni lanzar", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const project = projectId("invalid");
    const listener = vi.fn();
    const unsubscribe = subscribe(project, listener);

    expect(() =>
      publish({ type: "task.archived", projectId: project, actorUserId: "user_1" }),
    ).not.toThrow();

    expect(listener).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it("un listener que lanza no impide entregar a los demás", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const project = projectId("throws");
    const failing = vi.fn(() => {
      throw new Error("socket roto");
    });
    const healthy = vi.fn();
    const unsubscribeFailing = subscribe(project, failing);
    const unsubscribeHealthy = subscribe(project, healthy);

    const event = deletedEvent(project);
    expect(() => publish(event)).not.toThrow();

    expect(failing).toHaveBeenCalledTimes(1);
    expect(healthy).toHaveBeenCalledWith(event);
    expect(error).toHaveBeenCalledTimes(1);
    unsubscribeFailing();
    unsubscribeHealthy();
  });
});
