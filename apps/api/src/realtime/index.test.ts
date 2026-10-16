/**
 * Tests del hub en memoria: suscribir y recibir, aislamiento por project,
 * baja del suscriptor, publicar sin suscriptores y validación del evento.
 */
import type { BoardEvent } from "@agentic-kanban/schemas";
import { describe, expect, it } from "vite-plus/test";

import { publish, subscribe } from "./index.ts";

/** Evento válido de borrado; cada test usa projects propios (el hub es global). */
function deletedEvent(projectId: string, taskId = "task_1"): BoardEvent {
  return { type: "task.deleted", projectId, actorUserId: "user_1", taskId };
}

describe("hub de realtime", () => {
  it("entrega al suscriptor los eventos de su project", () => {
    const received: BoardEvent[] = [];
    const unsubscribe = subscribe("hub_proj_a", (event) => received.push(event));
    const event = deletedEvent("hub_proj_a");

    publish(event);

    expect(received).toEqual([event]);
    unsubscribe();
  });

  it("entrega a todos los suscriptores del mismo project", () => {
    const first: BoardEvent[] = [];
    const second: BoardEvent[] = [];
    const offFirst = subscribe("hub_proj_multi", (event) => first.push(event));
    const offSecond = subscribe("hub_proj_multi", (event) => second.push(event));
    const event = deletedEvent("hub_proj_multi");

    publish(event);

    expect(first).toEqual([event]);
    expect(second).toEqual([event]);
    offFirst();
    offSecond();
  });

  it("no entrega a un project lo publicado en otro", () => {
    const receivedB: BoardEvent[] = [];
    const offA = subscribe("hub_proj_iso_a", () => {});
    const offB = subscribe("hub_proj_iso_b", (event) => receivedB.push(event));

    publish(deletedEvent("hub_proj_iso_a"));

    expect(receivedB).toEqual([]);
    offA();
    offB();
  });

  it("deja de entregar tras darse de baja, sin afectar a los demás", () => {
    const gone: BoardEvent[] = [];
    const kept: BoardEvent[] = [];
    const offGone = subscribe("hub_proj_off", (event) => gone.push(event));
    const offKept = subscribe("hub_proj_off", (event) => kept.push(event));

    publish(deletedEvent("hub_proj_off", "task_1"));
    offGone();
    publish(deletedEvent("hub_proj_off", "task_2"));

    expect(gone).toEqual([deletedEvent("hub_proj_off", "task_1")]);
    expect(kept).toEqual([
      deletedEvent("hub_proj_off", "task_1"),
      deletedEvent("hub_proj_off", "task_2"),
    ]);
    offKept();
  });

  it("darse de baja dos veces no lanza", () => {
    const unsubscribe = subscribe("hub_proj_twice", () => {});

    unsubscribe();

    expect(() => unsubscribe()).not.toThrow();
  });

  it("publicar sin suscriptores no lanza", () => {
    expect(() => publish(deletedEvent("hub_proj_nobody"))).not.toThrow();
  });

  it("lanza con un evento inválido y no llega a ningún listener", () => {
    const received: BoardEvent[] = [];
    const unsubscribe = subscribe("hub_proj_invalid", (event) => received.push(event));
    // Sin `actorUserId`: el hub debe rechazarlo con boardEventSchema.parse.
    const invalid = { type: "task.deleted", projectId: "hub_proj_invalid", taskId: "task_1" };

    // @ts-expect-error evento deliberadamente inválido
    expect(() => publish(invalid)).toThrow();
    expect(received).toEqual([]);
    unsubscribe();
  });
});
