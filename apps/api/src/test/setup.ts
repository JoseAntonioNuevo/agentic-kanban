/**
 * Setup global de los tests (`test.setupFiles` en la config raíz de Vite+).
 *
 * Cada fichero de test tiene su propio registro de módulos (isolate), así que
 * este setup se ejecuta una vez por fichero y `@agentic-kanban/db` abre un
 * cliente nuevo: cada fichero obtiene su propia base temporal, con las
 * migraciones aplicadas. Nunca se toca `data/agentic-kanban.db`.
 */
import { randomUUID } from "node:crypto";
import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll } from "vite-plus/test";

const databasePath = join(tmpdir(), `agentic-kanban-test-${process.pid}-${randomUUID()}.db`);

// Debe fijarse ANTES de importar el código de la API o de la base.
process.env.DATABASE_URL = `file:${databasePath}`;

// Import dinámico: el módulo lee DATABASE_URL al abrir el cliente, no antes.
const { getLibsql, migrateDatabase } = await import("@agentic-kanban/db");

await migrateDatabase();

afterAll(() => {
  try {
    getLibsql().close();
  } catch {
    // El cliente ya podía estar cerrado.
  }

  for (const suffix of ["", "-wal", "-shm"]) {
    rmSync(`${databasePath}${suffix}`, { force: true });
  }
});
