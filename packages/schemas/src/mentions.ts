/**
 * Parser puro de menciones `@nombre` en el texto de un comentario.
 *
 * Reglas:
 * - El texto se normaliza a NFC antes de buscar, para que una tilde
 *   combinante (`e` + U+0301) coincida con la letra precompuesta (`é`).
 * - Una mención es `@` seguido de una o más letras Unicode (`\p{L}+`).
 * - El `@` debe estar al principio del texto o tras un carácter que no sea
 *   letra ni número: `ana@demo.test` y `x@Luis` no mencionan a nadie.
 * - La puntuación o los espacios cortan el nombre: `@Luis,` → `Luis`.
 * - Un número o `_` pegados al nombre anulan la mención: `@Luis2` no es `@Luis`.
 * - Sin duplicados, comparando en minúsculas (`es`); se conserva la grafía de
 *   la primera aparición y el orden de aparición.
 */
const MENTION_PATTERN = /(?<![\p{L}\p{N}])@(\p{L}+)(?![\p{L}\p{N}_])/gu;

export function extractMentionTokens(body: string): string[] {
  const seen = new Set<string>();
  const tokens: string[] = [];

  for (const match of body.normalize("NFC").matchAll(MENTION_PATTERN)) {
    const name = match[1];
    if (name === undefined) continue;
    const key = name.toLocaleLowerCase("es");
    if (seen.has(key)) continue;
    seen.add(key);
    tokens.push(name);
  }

  return tokens;
}
