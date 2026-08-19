/**
 * Utilidad de clases de shadcn.
 * `clsx` combina condicionales; `twMerge` resuelve conflictos de Tailwind
 * (p. ej. `p-2` + `p-4` → `p-4`).
 */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Junta classNames y deja ganar la utilidad Tailwind más específica. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
