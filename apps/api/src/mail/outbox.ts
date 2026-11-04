/**
 * Outbox local de correo: una línea JSON por email en un fichero `.jsonl`.
 *
 * Ruta: `OUTBOX_PATH` si existe (los tests la fijan en `tmpdir()`); si no,
 * `outbox.jsonl` junto al fichero de `DATABASE_URL` (Compose:
 * `/data/outbox.jsonl`; Mac: `data/outbox.jsonl`; Cloudflare: su disco
 * efímero). Se resuelve en cada escritura. No sale a la red.
 */
import { appendFile, mkdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

import { resolveDatabaseUrl } from "@agentic-kanban/db";

import type { OutgoingEmail } from "./index.ts";

/** Fichero del outbox para el entorno actual. */
export function resolveOutboxPath(): string {
  const configured = process.env.OUTBOX_PATH;
  if (configured) {
    return resolve(configured);
  }

  const databaseUrl = resolveDatabaseUrl();
  const directory = databaseUrl.startsWith("file:")
    ? dirname(databaseUrl.slice("file:".length))
    : process.cwd();
  return join(directory, "outbox.jsonl");
}

/** Añade el email como una línea JSON. Lanza si no se puede escribir. */
export async function writeToOutbox(email: OutgoingEmail): Promise<void> {
  const outboxPath = resolveOutboxPath();
  const line = JSON.stringify({
    to: email.to,
    subject: email.subject,
    body: email.text,
    notificationId: email.notificationId,
    createdAt: new Date().toISOString(),
  });

  await mkdir(dirname(outboxPath), { recursive: true });
  await appendFile(outboxPath, `${line}\n`, "utf8");
}
