/**
 * El destino del arrastre: misma columna, otra, columna vacía y soltar sin cambio.
 */
import { describe, expect, it } from "vite-plus/test";

import { destinationFromDrag } from "./board-drag.ts";

const source = {
  id: "task_b",
  index: 1,
  initialIndex: 1,
  group: "col_todo",
  initialGroup: "col_todo",
};

describe("destinationFromDrag", () => {
  it("ignora un arrastre cancelado o sin origen", () => {
    expect(
      destinationFromDrag({
        canceled: true,
        source,
        target: { sortable: true, id: "task_c", index: 2, group: "col_todo" },
      }),
    ).toBeNull();
    expect(destinationFromDrag({ canceled: false, source: null, target: null })).toBeNull();
    expect(destinationFromDrag({ canceled: false, source, target: null })).toBeNull();
  });

  it("si el target ya es null, usa el grupo y el índice finales del origen", () => {
    expect(
      destinationFromDrag({
        canceled: false,
        source: { ...source, group: "col_done", index: 0 },
        target: null,
      }),
    ).toEqual({ taskId: "task_b", columnId: "col_done", position: 0 });
  });

  it("no llama al movimiento si la tarjeta sigue en su sitio", () => {
    expect(
      destinationFromDrag({
        canceled: false,
        source,
        target: { sortable: true, id: "task_b", index: 1, group: "col_todo" },
      }),
    ).toBeNull();
  });

  it("usa el índice ya reordenado dentro de la misma columna", () => {
    expect(
      destinationFromDrag({
        canceled: false,
        source: { ...source, index: 0 },
        target: { sortable: true, id: "task_b", index: 0, group: "col_todo" },
      }),
    ).toEqual({ taskId: "task_b", columnId: "col_todo", position: 0 });
  });

  it("usa el grupo nuevo al cambiar de columna", () => {
    expect(
      destinationFromDrag({
        canceled: false,
        source: { ...source, group: "col_doing", index: 1 },
        target: { sortable: true, id: "task_b", index: 1, group: "col_doing" },
      }),
    ).toEqual({ taskId: "task_b", columnId: "col_doing", position: 1 });
  });

  it("si el plugin aún no movió el índice, toma el de la tarjeta destino", () => {
    expect(
      destinationFromDrag({
        canceled: false,
        source,
        target: { sortable: true, id: "task_a", index: 0, group: "col_doing" },
      }),
    ).toEqual({ taskId: "task_b", columnId: "col_doing", position: 0 });
  });

  it("suelta en una columna vacía en la posición 0", () => {
    expect(
      destinationFromDrag({
        canceled: false,
        source,
        target: { sortable: false, id: "col_done" },
      }),
    ).toEqual({ taskId: "task_b", columnId: "col_done", position: 0 });
  });

  it("conserva el índice si el droppable es la columna a la que ya se movió", () => {
    expect(
      destinationFromDrag({
        canceled: false,
        source: { ...source, group: "col_doing", index: 2 },
        target: { sortable: false, id: "col_doing" },
      }),
    ).toEqual({ taskId: "task_b", columnId: "col_doing", position: 2 });
  });
});
