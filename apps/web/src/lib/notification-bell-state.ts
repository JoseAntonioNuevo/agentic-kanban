/**
 * Estado de la campana a partir de sus dos queries, sin confundir los casos.
 *
 * El badge y el «Nada pendiente» salen del contador del servidor, no de las
 * filas cargadas: con más de una página siguen siendo exactos. La bandeja
 * distingue cargando, error (HTTP no ok o parse fallido), vacía (un éxito) y
 * lista, con `hasMore` si quedan páginas. Un error nunca se pinta como
 * bandeja vacía ni como «Nada pendiente».
 */
import type { NotificationListResponse } from "@agentic-kanban/schemas";

type QueryStatus = "pending" | "error" | "success";

export type UnreadState = { kind: "unknown" } | { kind: "known"; count: number };

/** Contador de no leídas, solo si la última consulta fue bien. */
export function unreadState(query: { status: QueryStatus; data: number | undefined }): UnreadState {
  if (query.status !== "success" || query.data === undefined) return { kind: "unknown" };
  return { kind: "known", count: query.data };
}

/** Texto del badge: nada con 0 o desconocido, «99+» por encima de 99. */
export function unreadBadgeLabel(state: UnreadState): string | undefined {
  if (state.kind === "unknown" || state.count === 0) return undefined;
  return state.count > 99 ? "99+" : String(state.count);
}

export type NotificationListState =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "empty" }
  | { kind: "list"; items: NotificationListResponse; hasMore: boolean };

/** Bandeja ya aplanada desde las páginas de la infinite query. */
export function notificationListState(query: {
  status: QueryStatus;
  pages: NotificationListResponse[] | undefined;
  hasNextPage: boolean;
}): NotificationListState {
  if (query.status === "error") return { kind: "error" };
  if (query.status === "pending" || query.pages === undefined) return { kind: "loading" };

  const items = query.pages.flat();
  if (items.length === 0) return { kind: "empty" };
  return { kind: "list", items, hasMore: query.hasNextPage };
}
