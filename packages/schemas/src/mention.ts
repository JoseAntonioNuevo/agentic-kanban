/**
 * Tokens `@Nombre` de un comentario. La resolución a miembros del
 * workspace (y el salto de desconocidos / auto-mención) vive en la API/db.
 *
 * Solo letras Unicode: `@Luis,` y `@Luis.` capturan `Luis`. El parser
 * no mira membresía ni email.
 */
const MENTION_RE = /(?<![\p{L}])@(\p{L}+)/gu;

/** Nombres únicos (case-insensitive), sin `@`. Se conserva la primera forma. */
export function extractMentionNames(body: string): string[] {
  const names: string[] = [];
  const seen = new Set<string>();

  for (const match of body.matchAll(MENTION_RE)) {
    const token = match[1];
    if (!token) {
      continue;
    }

    const key = token.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    names.push(token);
  }

  return names;
}
