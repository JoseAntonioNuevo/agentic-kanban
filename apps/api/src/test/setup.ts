/**
 * Base temporal por fichero de test.
 *
 * Vite+ ejecuta los ficheros en paralelo y este setup corre también para
 * schemas y para la web. `DATABASE_URL` se fija antes de importar
 * `@agentic-kanban/db`: el cliente cachea la URL en el primer acceso.
 * Nunca apunta a `data/`.
 */
import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll } from "vite-plus/test";

const databasePath = join(tmpdir(), `agentic-kanban-${randomUUID()}.db`);
process.env.DATABASE_URL = `file:${databasePath}`;

const { getLibsql, migrateDatabase } = await import("@agentic-kanban/db");

afterAll(async () => {
  try {
    getLibsql().close();
  } catch {
    // Si la migración falló antes de abrir el fichero, no hay handle.
  }

  await Promise.all(
    [databasePath, `${databasePath}-wal`, `${databasePath}-shm`].map((filePath) =>
      rm(filePath, { force: true }),
    ),
  );
});

await migrateDatabase();
