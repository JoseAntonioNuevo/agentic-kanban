/**
 * Config de Drizzle Kit (`db:generate` / `db:migrate`).
 *
 * El esqueleto no auto-ejecuta migraciones: no hay schema de producto.
 * `dialect: "sqlite"` encaja con libSQL en fichero. La URL por defecto
 * es el mismo `data/agentic-kanban.db` que TablePlus y Compose.
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
