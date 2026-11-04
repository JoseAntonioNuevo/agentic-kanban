/**
 * Base temporal por fichero de test.
 *
 * Vite+ ejecuta los ficheros en paralelo y este setup corre también para
 * schemas y para la web. `DATABASE_URL` se fija antes de importar
 * `@agentic-kanban/db`: el cliente cachea la URL en el primer acceso.
 * `OUTBOX_PATH` lleva el outbox de correo a un fichero temporal. Nunca
 * apuntan a `data/` y nada sale a la red.
 */
import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll } from "vite-plus/test";

const databasePath = join(tmpdir(), `agentic-kanban-${randomUUID()}.db`);
const outboxPath = join(tmpdir(), `agentic-kanban-outbox-${randomUUID()}.jsonl`);
process.env.DATABASE_URL = `file:${databasePath}`;
process.env.OUTBOX_PATH = outboxPath;
// Ningún test lee credenciales reales de correo.
for (const name of [
  "CLOUDFLARE_ACCOUNT_ID",
  "CLOUDFLARE_EMAIL_TOKEN",
  "MAIL_FROM",
  "MAIL_REDIRECT_TO",
]) {
  delete process.env[name];
}

const { getLibsql, migrateDatabase } = await import("@agentic-kanban/db");

afterAll(async () => {
  try {
    getLibsql().close();
  } catch {
    // Si la migración falló antes de abrir el fichero, no hay handle.
  }

  await Promise.all(
    [databasePath, `${databasePath}-wal`, `${databasePath}-shm`, outboxPath].map((filePath) =>
      rm(filePath, { force: true }),
    ),
  );
});

await migrateDatabase();
