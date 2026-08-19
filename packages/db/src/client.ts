/**
 * Cliente lazy de libSQL + Drizzle.
 *
 * No se abre el fichero al importar el módulo: Docker monta `/data` después
 * de arrancar el proceso. `getDb()` / `getLibsql()` (y los proxies `db` /
 * `libsql`) crean el cliente en la primera query.
 *
 * Cadena: Hono → drizzle-orm/libsql → @libsql/client → file:…/agentic-kanban.db
 */
import { createClient, type Client } from "@libsql/client";
import { sql } from "drizzle-orm";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Resuelve la URL del fichero SQLite.
 * En Compose: `DATABASE_URL=file:/data/agentic-kanban.db`.
 * En el Mac: `file:<repo>/data/agentic-kanban.db` (el mismo path que TablePlus).
 */
function resolveDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
  return `file:${resolve(repoRoot, "data/agentic-kanban.db")}`;
}

/** Crea el directorio del `.db` si la URL es `file:` y la carpeta no existe. */
function ensureDatabaseDirectory(url: string): void {
  if (!url.startsWith("file:")) {
    return;
  }

  mkdirSync(dirname(url.slice("file:".length)), { recursive: true });
}

let cachedClient: Client | undefined;
let cachedDb: LibSQLDatabase | undefined;

/** Abre (o reutiliza) el cliente libSQL y el wrapper de Drizzle. */
function openDatabase(): { client: Client; db: LibSQLDatabase } {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const databaseUrl = resolveDatabaseUrl();
  ensureDatabaseDirectory(databaseUrl);
  cachedClient = createClient({ url: databaseUrl });
  cachedDb = drizzle(cachedClient);
  return { client: cachedClient, db: cachedDb };
}

/**
 * Cierra el handle cacheado. Útil si Docker remonta el volumen y el
 * descriptor queda inválido (`SQLITE_READONLY_DBMOVED` en el pasado).
 */
function resetDatabase(): void {
  if (cachedClient) {
    try {
      cachedClient.close();
    } catch {
      // El handle anterior puede estar ya inválido tras un remount.
    }
  }

  cachedClient = undefined;
  cachedDb = undefined;
}

/** Cliente crudo de `@libsql/client`. */
export function getLibsql(): Client {
  return openDatabase().client;
}

/** Instancia de Drizzle para `SELECT` / `insert` / migraciones futuras. */
export function getDb(): LibSQLDatabase {
  return openDatabase().db;
}

/**
 * Proxy que reenvía cada acceso al objeto real.
 * Así se puede exportar `db` en el top-level sin abrir el fichero al importar.
 */
function forward<T extends object>(getTarget: () => T): T {
  return new Proxy({} as T, {
    get(_target, property, receiver) {
      const actual = getTarget();
      const value = Reflect.get(actual, property, receiver);
      return typeof value === "function"
        ? (value as (...args: never[]) => unknown).bind(actual)
        : value;
    },
  });
}

export const db: LibSQLDatabase = forward(getDb);
export const libsql: Client = forward(getLibsql);

/**
 * Health de la base: `SELECT 1`.
 * Si el handle está stale, se resetea y se reintenta una vez.
 */
export async function pingDatabase(): Promise<void> {
  try {
    await getDb().run(sql`SELECT 1`);
  } catch {
    resetDatabase();
    await getDb().run(sql`SELECT 1`);
  }
}
