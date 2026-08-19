/**
 * Config de Drizzle Kit (`db:generate` / `db:migrate`).
 *
 * No auto-ejecuta migraciones. `dialect: "sqlite"` encaja con libSQL en
 * fichero. La URL por defecto es el mismo `data/agentic-kanban.db` que
 * TablePlus y Compose. No uses esta URL si Compose ya tiene la API arriba.
 */
import { defineConfig } from "drizzle-kit";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const defaultDatabaseUrl = `file:${resolve(repoRoot, "data/agentic-kanban.db")}`;

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/schema/index.ts",
  out: "./migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? defaultDatabaseUrl,
  },
});
