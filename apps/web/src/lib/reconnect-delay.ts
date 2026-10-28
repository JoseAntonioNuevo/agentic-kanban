/**
 * Espera en milisegundos antes de cada reintento del canal en vivo:
 * 1 s, 2 s, 5 s y 10 s desde el cuarto intento.
 */
const RECONNECT_DELAYS_MS = [1000, 2000, 5000] as const;
const MAX_RECONNECT_DELAY_MS = 10_000;

export function reconnectDelay(attempt: number): number {
  return RECONNECT_DELAYS_MS[attempt] ?? MAX_RECONNECT_DELAY_MS;
}
