/**
 * Limpia la caché de TanStack Query cuando cambia la identidad de la sesión.
 *
 * Las queries de datos del usuario usan `[scope, userId, ...]`. Health
 * queda en `["health"]` y no lleva userId, así que un cambio A → B no la toca.
 */
import type { QueryClient } from "@tanstack/react-query";

/**
 * Ajusta la caché al pasar de `previousUserId` a `nextUserId`.
 *
 * - Sin usuario previo, o la misma identidad: no hace nada.
 * - Logout o sesión perdida (`next` null): `clear()`, que destruye cada
 *   query y cancela su fetch.
 * - De A a otro usuario B: quita y cancela solo las queries cuyo segundo
 *   elemento de la queryKey es A. Las de B y `["health"]` siguen.
 */
export function resetCacheForIdentityChange(
  queryClient: QueryClient,
  previousUserId: string | null,
  nextUserId: string | null,
): void {
  if (previousUserId === null || previousUserId === nextUserId) {
    return;
  }

  if (nextUserId === null) {
    queryClient.clear();
    return;
  }

  queryClient.removeQueries({
    predicate: (query) => query.queryKey[1] === previousUserId,
  });
}
