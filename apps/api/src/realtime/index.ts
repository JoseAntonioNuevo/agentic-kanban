/**
 * Hub in-memory de anuncios de tablero (mismo proceso Hono).
 *
 * `subscribe` registra un listener por `projectId`. `publish` parsea con
 * `boardEventSchema` y fanea a esos listeners; si no hay suscriptores, no-op.
 * Las rutas de board y de comentarios publican tras un write HTTP exitoso.
 */
import { boardEventSchema, type BoardEvent } from "@agentic-kanban/schemas";

export type BoardEventListener = (event: BoardEvent) => void;

const subscribers = new Map<string, Set<BoardEventListener>>();

export function subscribe(projectId: string, listener: BoardEventListener): () => void {
  let set = subscribers.get(projectId);
  if (!set) {
    set = new Set();
    subscribers.set(projectId, set);
  }
  set.add(listener);

  let unsubscribed = false;
  return () => {
    if (unsubscribed) {
      return;
    }
    unsubscribed = true;
    const current = subscribers.get(projectId);
    if (!current) {
      return;
    }
    current.delete(listener);
    if (current.size === 0) {
      subscribers.delete(projectId);
    }
  };
}

export function publish(event: BoardEvent): void {
  const parsed = boardEventSchema.parse(event);
  const set = subscribers.get(parsed.projectId);
  if (!set || set.size === 0) {
    return;
  }

  for (const listener of [...set]) {
    listener(parsed);
  }
}
