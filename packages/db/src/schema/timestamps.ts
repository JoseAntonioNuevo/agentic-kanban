/**
 * Default compartido de columnas `timestamp_ms`.
 *
 * El mismo SQL que el adaptador de Drizzle de Better Auth, para que
 * `created_at` de tenant se serialice igual que el de `user`.
 */
import { sql } from "drizzle-orm";

/** Milisegundos UTC actuales, como expresión SQL. */
export function nowMs() {
  return sql`(cast(unixepoch('subsecond') * 1000 as integer))`;
}
