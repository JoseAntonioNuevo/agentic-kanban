/**
 * Hub de eventos del tablero, en memoria y por proceso.
 *
 * `subscribe` registra un listener para un project y devuelve la función que
 * lo da de baja; `publish` valida el evento con el contrato compartido y lo
 * reparte solo a los listeners de su `projectId`. Vive en este mismo proceso
 * Hono: sin Socket.IO, Redis ni servicio aparte.
 */
import { boardEventSchema, type BoardEvent } from "@agentic-kanban/schemas";

export type BoardEventListener = (event: BoardEvent) => void;

const listenersByProject = new Map<string, Set<BoardEventListener>>();

/** Suscribe un listener a los eventos de un project; devuelve la baja. */
export function subscribe(projectId: string, listener: BoardEventListener): () => void {
  let listeners = listenersByProject.get(projectId);
  if (!listeners) {
    listeners = new Set();
    listenersByProject.set(projectId, listeners);
  }
  listeners.add(listener);

  return () => {
    const current = listenersByProject.get(projectId);
    if (!current) return;
    current.delete(listener);
    // Sin suscriptores se borra el Set para no acumular claves vacías.
    if (current.size === 0) listenersByProject.delete(projectId);
  };
}

/** Valida y reparte el evento a los suscriptores de su project. */
export function publish(event: BoardEvent): void {
  const parsed = boardEventSchema.parse(event);
  const listeners = listenersByProject.get(parsed.projectId);
  if (!listeners) return;

  // Copia: un listener puede darse de baja mientras se reparte.
  for (const listener of [...listeners]) {
    try {
      listener(parsed);
    } catch (error) {
      // Un listener roto no debe impedir que los demás reciban el evento.
      console.error("Listener de eventos del tablero falló", error);
    }
  }
}
