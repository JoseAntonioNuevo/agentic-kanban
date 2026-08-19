/**
 * Un único QueryClient para todo el SPA.
 *
 * El estado de servidor (respuestas de `/api/...`) vive aquí.
 * El estado local de UI (modales, inputs) se queda en `useState`.
 * `retry: 1` evita martillar la API si el health falla al arrancar.
 */
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
    },
  },
});
