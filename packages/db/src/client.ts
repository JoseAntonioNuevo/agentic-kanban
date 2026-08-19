import { createClient, type Client } from "@libsql/client";
import { sql } from "drizzle-orm";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

function resolveDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
  return `file:${resolve(repoRoot, "data/agentic-kanban.db")}`;
}

function ensureDatabaseDirectory(url: string): void {
  if (!url.startsWith("file:")) {
    return;
  }

  mkdirSync(dirname(url.slice("file:".length)), { recursive: true });
}

let cachedClient: Client | undefined;
let cachedDb: LibSQLDatabase | undefined;

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

function resetDatabase(): void {
  if (cachedClient) {
    try {
      cachedClient.close();
    } catch {
      // The previous handle may already be invalid after a volume remount.
    }
  }

  cachedClient = undefined;
  cachedDb = undefined;
}

export function getLibsql(): Client {
  return openDatabase().client;
}

export function getDb(): LibSQLDatabase {
  return openDatabase().db;
}

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

export async function pingDatabase(): Promise<void> {
  try {
    await getDb().run(sql`SELECT 1`);
  } catch {
    resetDatabase();
    await getDb().run(sql`SELECT 1`);
  }
}
