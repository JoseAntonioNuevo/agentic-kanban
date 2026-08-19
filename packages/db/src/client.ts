import { createClient, type Client } from "@libsql/client";
import { sql } from "drizzle-orm";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import * as schema from "./schema/index.ts";

export type AppSchema = typeof schema;
export type Database = LibSQLDatabase<AppSchema>;

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
let cachedDb: Database | undefined;
let foreignKeysReady: Promise<void> | undefined;

function openDatabase(): { client: Client; db: Database } {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const databaseUrl = resolveDatabaseUrl();
  ensureDatabaseDirectory(databaseUrl);
  cachedClient = createClient({ url: databaseUrl });
  cachedDb = drizzle(cachedClient, { schema });
  return { client: cachedClient, db: cachedDb };
}

export function resetDatabase(): void {
  if (cachedClient) {
    try {
      cachedClient.close();
    } catch {
      // The previous handle may already be invalid after a volume remount.
    }
  }

  cachedClient = undefined;
  cachedDb = undefined;
  foreignKeysReady = undefined;
}

export async function ensureForeignKeys(): Promise<void> {
  const { client } = openDatabase();
  foreignKeysReady ??= client.execute("PRAGMA foreign_keys = ON").then(() => undefined);
  await foreignKeysReady;
}

export function getLibsql(): Client {
  return openDatabase().client;
}

export function getDb(): Database {
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

export const db: Database = forward(getDb);
export const libsql: Client = forward(getLibsql);

export async function pingDatabase(): Promise<void> {
  try {
    await ensureForeignKeys();
    await getDb().run(sql`SELECT 1`);
  } catch {
    resetDatabase();
    await ensureForeignKeys();
    await getDb().run(sql`SELECT 1`);
  }
}
