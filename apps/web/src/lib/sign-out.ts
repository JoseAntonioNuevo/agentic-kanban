/**
 * Cierra sesión sin dejar queries privadas en vuelo.
 *
 * Better Auth resuelve `signOut` antes de que `useSession` pase a null
 * y, si falla la red, devuelve `{ error }` en lugar de lanzar. Por eso
 * la UI privada se desmonta antes de la petición y `clear()` corre
 * cuando esos observers ya no están.
 */
import type { QueryClient } from "@tanstack/react-query";

/** `true` si el resultado de better-fetch trae un `error` no nulo. */
function signOutReturnedError(result: unknown): boolean {
  return typeof result === "object" && result !== null && "error" in result && result.error != null;
}

/**
 * Oculta los datos privados, cierra sesión y vacía la caché.
 *
 * Orden: `setPrivateVisible(false)`, `await signOut()`, `queryClient.clear()`.
 * Éxito = no lanza y no trae `error` no nulo. Si falla, vuelve a mostrar
 * la UI del mismo usuario después del `clear`. Devuelve si tuvo éxito.
 */
export async function signOutAndClearPrivateData({
  signOut,
  queryClient,
  setPrivateVisible,
}: {
  signOut: () => Promise<unknown>;
  queryClient: QueryClient;
  setPrivateVisible: (visible: boolean) => void;
}): Promise<boolean> {
  setPrivateVisible(false);

  let succeeded = true;
  try {
    const result = await signOut();
    if (signOutReturnedError(result)) {
      succeeded = false;
    }
  } catch {
    succeeded = false;
  }

  queryClient.clear();

  if (!succeeded) {
    setPrivateVisible(true);
  }

  return succeeded;
}
