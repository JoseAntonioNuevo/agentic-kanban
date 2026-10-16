/**
 * Outbox de correo de aula: no hay Resend, SMTP ni contenedor de correo.
 * Cada email es una línea JSON añadida a un fichero `outbox.jsonl` que se
 * puede inspeccionar con `tail -f`.
 */
import { getDatabaseFilePath } from "@agentic-kanban/db";
import { appendFile, mkdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export type OutboxEmail = {
  to: string;
  subject: string;
  body: string;
  notificationId: string;
  createdAt: string;
};

/**
 * Ruta del outbox: `OUTBOX_PATH` si existe (tests); si no, `outbox.jsonl` junto
 * al fichero de la base (en Compose `/data/outbox.jsonl`, en el Mac
 * `data/outbox.jsonl`).
 */
export function resolveOutboxPath(): string {
  if (process.env.OUTBOX_PATH) {
    return process.env.OUTBOX_PATH;
  }

  const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
  const databasePath = getDatabaseFilePath() ?? resolve(repoRoot, "data/agentic-kanban.db");
  return join(dirname(databasePath), "outbox.jsonl");
}

/**
 * Añade los emails al outbox con un solo `appendFile` (una línea JSON por
 * email). Lanza si falla: el llamador decide qué hacer con el error.
 */
export async function appendToOutbox(emails: OutboxEmail[]): Promise<void> {
  if (emails.length === 0) {
    return;
  }

  const path = resolveOutboxPath();
  await mkdir(dirname(path), { recursive: true });
  await appendFile(path, emails.map((email) => `${JSON.stringify(email)}\n`).join(""), "utf8");
}
