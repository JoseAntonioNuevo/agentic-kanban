/**
 * La espera crece por tramos y se queda en el tope.
 */
import { describe, expect, it } from "vite-plus/test";

import { reconnectDelay } from "./reconnect-delay.ts";

describe("reconnectDelay", () => {
  it("devuelve 1 s, 2 s y 5 s en los tres primeros intentos", () => {
    expect(reconnectDelay(0)).toBe(1000);
    expect(reconnectDelay(1)).toBe(2000);
    expect(reconnectDelay(2)).toBe(5000);
  });

  it("se queda en 10 s a partir del cuarto intento", () => {
    expect(reconnectDelay(3)).toBe(10_000);
    expect(reconnectDelay(4)).toBe(10_000);
    expect(reconnectDelay(1000)).toBe(10_000);
  });
});
