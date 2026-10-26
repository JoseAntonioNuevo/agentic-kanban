/**
 * Color de acento de un workspace.
 *
 * Pura y determinista: solo entra `workspaceId` (FNV-1a de 32 bits).
 * Ni el nombre del espacio ni el email del usuario cambian el resultado,
 * así Ana y Luis ven el mismo swatch en el mismo id.
 */

/** Paleta fija, legible sobre fondo claro y oscuro. El índice sale del hash. */
const WORKSPACE_ACCENTS = [
  "oklch(0.72 0.15 25)",
  "oklch(0.75 0.14 55)",
  "oklch(0.78 0.13 95)",
  "oklch(0.74 0.14 145)",
  "oklch(0.72 0.12 175)",
  "oklch(0.7 0.13 220)",
  "oklch(0.68 0.14 255)",
  "oklch(0.7 0.15 295)",
  "oklch(0.72 0.15 330)",
  "oklch(0.7 0.12 15)",
] as const;

const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

/** FNV-1a 32 bits sobre los code units del id. Siempre un entero sin signo. */
function fnv1a32(value: string): number {
  let hash = FNV_OFFSET_BASIS;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, FNV_PRIME);
  }

  return hash >>> 0;
}

/** Devuelve un color CSS `oklch(...)` estable para este workspace. */
export function workspaceAccent(workspaceId: string): string {
  const accent = WORKSPACE_ACCENTS[fnv1a32(workspaceId) % WORKSPACE_ACCENTS.length];

  if (accent === undefined) {
    return WORKSPACE_ACCENTS[0];
  }

  return accent;
}
