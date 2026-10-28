/**
 * Hub en memoria de los anuncios del tablero.
 *
 * Vive en este mismo proceso Hono: sin Socket.IO, Redis ni servicio aparte.
 * Los suscriptores se agrupan por `projectId`. `publish` nunca lanza: se
 * llamará después de guardar, y un fallo del hub no puede convertir una
 * escritura ya persistida en un 5xx.
 */
import { boardEventSchema, type BoardEvent } from "@agentic-kanban/schemas";

export type BoardEventListener = (event: BoardEvent) => void;

const listenersByProject = new Map<string, Set<BoardEventListener>>();

/** Suscribe `listener` a los eventos de `projectId`; devuelve la baja. */
export function subscribe(projectId: string, listener: BoardEventListener): () => void {
  let listeners = listenersByProject.get(projectId);
  if (listeners === undefined) {
    listeners = new Set();
    listenersByProject.set(projectId, listeners);
  }
  listeners.add(listener);

  return () => {
    const current = listenersByProject.get(projectId);
    if (current === undefined) {
      return;
    }
    current.delete(listener);
    if (current.size === 0) {
      listenersByProject.delete(projectId);
    }
  };
}

/** Valida el evento y lo reparte a los suscriptores de su project. */
export function publish(event: unknown): void {
  const parsed = boardEventSchema.safeParse(event);
  if (!parsed.success) {
    console.error("realtime: evento inválido descartado", parsed.error.issues);
    return;
  }

  const listeners = listenersByProject.get(parsed.data.projectId);
  if (listeners === undefined) {
    return;
  }

  // Copia: un listener puede darse de baja mientras se reparte.
  for (const listener of [...listeners]) {
    try {
      listener(parsed.data);
    } catch (error) {
      console.error("realtime: un listener falló", error);
    }
  }
}
