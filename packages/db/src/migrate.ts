/**
 * Aplica las migraciones de `packages/db/migrations` sobre la base actual.
 *
 * Lo usa el arnés de tests con su base temporal. La API nunca migra al
 * arrancar: en Docker se aplica con `bun run db:migrate`.
 */
import { migrate } from "drizzle-orm/libsql/migrator";
import { fileURLToPath } from "node:url";

import { getDb } from "./client.ts";

export async function migrateDatabase(): Promise<void> {
  await migrate(getDb(), {
    migrationsFolder: fileURLToPath(new URL("../migrations", import.meta.url)),
  });
}
