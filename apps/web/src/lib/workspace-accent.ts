/**
 * Color de acento de un workspace.
 *
 * Función pura: el tono sale de un hash FNV-1a de `workspaceId` y de nada
 * más (ni nombre del workspace ni datos del usuario). Así Ana y Luis ven el
 * mismo color en `ws_thepower_demo`.
 */

/** Hash FNV-1a de 32 bits, estable entre ejecuciones. */
function fnv1a(text: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

/** Devuelve un color CSS `hsl(<tono> 65% 45%)` derivado solo del id. */
export function workspaceAccent(workspaceId: string): string {
  const hue = fnv1a(workspaceId) % 360;
  return `hsl(${hue} 65% 45%)`;
}
