/**
 * Tests del outbox de aula: una línea JSON por email, lista vacía sin fichero,
 * resolución de ruta desde `DATABASE_URL` y rechazo si no se puede escribir.
 */
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";

import { appendToOutbox, resolveOutboxPath } from "./outbox.ts";
import type { OutboxEmail } from "./outbox.ts";

function email(n: number): OutboxEmail {
  return {
    to: `user${n}@example.com`,
    subject: `Asunto ${n}`,
    body: `Cuerpo ${n}\ncon salto de línea`,
    notificationId: `notification-${n}`,
    createdAt: new Date(2026, 0, n).toISOString(),
  };
}

describe("outbox de correo de aula", () => {
  let tempDir: string;
  const originalOutboxPath = process.env.OUTBOX_PATH;
  const originalDatabaseUrl = process.env.DATABASE_URL;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "outbox-test-"));
  });

  afterEach(async () => {
    restoreEnv("OUTBOX_PATH", originalOutboxPath);
    restoreEnv("DATABASE_URL", originalDatabaseUrl);
    await rm(tempDir, { recursive: true, force: true });
  });

  function restoreEnv(name: string, value: string | undefined): void {
    if (value === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  }

  it("escribe una línea JSON por email con los cinco campos", async () => {
    const path = join(tempDir, "outbox.jsonl");
    process.env.OUTBOX_PATH = path;

    await appendToOutbox([email(1), email(2)]);

    const lines = (await readFile(path, "utf8")).split("\n");
    expect(lines.at(-1)).toBe("");
    const parsed = lines.slice(0, -1).map((line): unknown => JSON.parse(line));
    expect(parsed).toEqual([email(1), email(2)]);
    expect(Object.keys(parsed[0] as object).sort()).toEqual([
      "body",
      "createdAt",
      "notificationId",
      "subject",
      "to",
    ]);
  });

  it("añade al final sin sobrescribir llamadas anteriores", async () => {
    const path = join(tempDir, "outbox.jsonl");
    process.env.OUTBOX_PATH = path;

    await appendToOutbox([email(1)]);
    await appendToOutbox([email(2)]);

    const lines = (await readFile(path, "utf8")).trim().split("\n");
    expect(lines).toHaveLength(2);
  });

  it("no crea el fichero con una lista vacía", async () => {
    const path = join(tempDir, "sub", "outbox.jsonl");
    process.env.OUTBOX_PATH = path;

    await appendToOutbox([]);

    expect(existsSync(path)).toBe(false);
    expect(existsSync(join(tempDir, "sub"))).toBe(false);
  });

  it("sin OUTBOX_PATH usa outbox.jsonl junto al fichero de DATABASE_URL", () => {
    delete process.env.OUTBOX_PATH;
    process.env.DATABASE_URL = "file:/tmp/x/agentic-kanban.db";

    expect(resolveOutboxPath()).toBe("/tmp/x/outbox.jsonl");
  });

  it("rechaza si el directorio no se puede crear", async () => {
    const blocker = join(tempDir, "es-un-fichero");
    await writeFile(blocker, "x");
    process.env.OUTBOX_PATH = join(blocker, "outbox.jsonl");

    await expect(appendToOutbox([email(1)])).rejects.toThrow();
  });
});
