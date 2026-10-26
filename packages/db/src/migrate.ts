/**
 * Aplica las migraciones de `packages/db/migrations`.
 *
 * Lo usa el arnés de tests. La API no migra al arrancar. La ruta es
 * absoluta: el migrador de Drizzle lee `meta/_journal.json` desde ahí.
 * Sin APIs `Bun.*`: `vp test` corre en Node.
 */
import { migrate } from "drizzle-orm/libsql/migrator";
import { fileURLToPath } from "node:url";

import { getDb } from "./client.ts";

export async function migrateDatabase(): Promise<void> {
  await migrate(getDb(), {
    migrationsFolder: fileURLToPath(new URL("../migrations", import.meta.url)),
  });
}
