/**
 * Punto de entrada del SPA.
 *
 * Monta React en #root y envuelve la app con los providers que el resto
 * del frontend da por sentados:
 * - QueryClientProvider: un único cliente de TanStack Query para estado de servidor.
 * - TooltipProvider: contexto de tooltips de shadcn/Radix.
 * - Toaster: toasts (sonner), p. ej. el aviso al fallar un movimiento de tarea.
 */
import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { Toaster } from "@/components/ui/sonner.tsx";
import { TooltipProvider } from "@/components/ui/tooltip.tsx";

import App from "./App.tsx";
import "./index.css";
import { queryClient } from "./lib/query-client.ts";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("No se encontró el elemento #root");
}

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <App />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  </StrictMode>,
);
