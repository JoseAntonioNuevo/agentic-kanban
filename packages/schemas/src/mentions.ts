/**
 * Menciones `@Nombre` dentro del texto de un comentario.
 *
 * Una mención es `@` seguido de letras Unicode (`\p{L}+`, con tildes). El
 * `@` va al principio del texto o tras un carácter que no sea letra ni
 * número, así `ana@demo.test` no menciona a nadie. La puntuación corta el
 * nombre (`@Luis,` → `Luis`). El texto se normaliza a NFC para que una tilde
 * escrita como carácter combinado siga contando como letra.
 *
 * Es pura: no resuelve usuarios. La API compara los tokens, sin distinguir
 * mayúsculas, con `user.name` de los miembros del workspace.
 */
const MENTION_PATTERN = /(?<![\p{L}\p{N}])@(\p{L}+)/gu;

/**
 * Tokens mencionados en orden de aparición, sin `@` y sin duplicados (sin
 * distinguir mayúsculas). Conserva la grafía de la primera aparición.
 */
export function extractMentionTokens(body: string): string[] {
  const seen = new Set<string>();
  const tokens: string[] = [];

  for (const match of body.normalize("NFC").matchAll(MENTION_PATTERN)) {
    const token = match[1];
    if (token === undefined) {
      continue;
    }

    // `toLowerCase()` pliega `Ñ`/`Á` igual en cualquier locale del proceso.
    const key = token.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      tokens.push(token);
    }
  }

  return tokens;
}
