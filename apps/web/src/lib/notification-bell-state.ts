/**
 * Estado de la campana a partir de la query de notificaciones (función pura).
 *
 * Un error de la query nunca se confunde con una bandeja vacía: solo un éxito
 * con `[]` produce `empty`. Con `refetchInterval` un refetch puede fallar con
 * filas ya en caché: entonces se sigue pintando la lista, marcada como
 * desactualizada (`stale`), en lugar de taparla con el error; con `stale` el
 * popover no dice «Nada pendiente».
 */
import type { NotificationListResponse } from "@agentic-kanban/schemas";

export type BellQueryLike = {
  status: "pending" | "error" | "success";
  data?: NotificationListResponse;
};

export type BellState =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "empty" }
  | { kind: "list"; unread: number; stale: boolean };

/** Decide qué pinta el popover: carga, error, vacío o lista con no leídas. */
export function bellState(query: BellQueryLike): BellState {
  const failed = query.status === "error";

  // Sin filas que enseñar, un error es un error (nunca «No hay menciones.»).
  if (failed && (query.data === undefined || query.data.length === 0)) {
    return { kind: "error" };
  }

  if (query.data === undefined) {
    return { kind: "loading" };
  }

  if (query.data.length === 0) {
    return { kind: "empty" };
  }

  return {
    kind: "list",
    unread: query.data.filter((row) => row.readAt === null).length,
    stale: failed,
  };
}
