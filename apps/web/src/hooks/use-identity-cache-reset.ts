/**
 * Observa el userId de la sesión y limpia la caché si la identidad cambia.
 *
 * Vive en `App`, fuera de las ramas, para correr también cuando no hay
 * sesión (logout) y no solo dentro del dashboard.
 */
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import { resetCacheForIdentityChange } from "@/lib/identity-cache.ts";

/** Compara el userId anterior con el actual y aplica `resetCacheForIdentityChange`. */
export function useIdentityCacheReset(userId: string | null): void {
  const queryClient = useQueryClient();
  const previousUserId = useRef(userId);

  useEffect(() => {
    resetCacheForIdentityChange(queryClient, previousUserId.current, userId);
    previousUserId.current = userId;
  }, [queryClient, userId]);
}
