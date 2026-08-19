import { migrate } from "drizzle-orm/libsql/migrator";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { ensureForeignKeys, getDb } from "./client.ts";

export async function applyMigrations(): Promise<void> {
  const migrationsFolder = resolve(dirname(fileURLToPath(import.meta.url)), "../migrations");
  await migrate(getDb(), { migrationsFolder });
  await ensureForeignKeys();
}
