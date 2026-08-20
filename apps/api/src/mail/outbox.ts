/**
 * “Envío” de email de mención: una línea JSON por notificación en
 * `outbox.jsonl`, en el mismo directorio que el `.db`. Sin Resend, SMTP
 * ni contenedor extra. Si el fichero falla, se registra y no se marca
 * `emailed_at`; el POST del comentario no debe fallar.
 */
import {
  markNotificationsEmailed,
  resolveDatabaseUrl,
  type NotificationRow,
} from "@agentic-kanban/db";
import { appendFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";

export type OutboxLine = {
  to: string;
  subject: string;
  body: string;
  commentId: string;
  recipientUserId: string;
  sentAt: string;
};

let outboxPathOverride: string | undefined;

export function setOutboxPathForTests(path: string | undefined): void {
  outboxPathOverride = path;
}

export function outboxPathFromDatabaseUrl(databaseUrl: string): string {
  if (!databaseUrl.startsWith("file:")) {
    throw new Error("DATABASE_URL must start with file:");
  }

  return join(dirname(databaseUrl.slice("file:".length)), "outbox.jsonl");
}

export function resolveOutboxPath(): string {
  if (outboxPathOverride) {
    return outboxPathOverride;
  }

  return outboxPathFromDatabaseUrl(resolveDatabaseUrl());
}

export async function writeMentionOutbox(notifications: NotificationRow[]): Promise<void> {
  if (notifications.length === 0) {
    return;
  }

  const sentAt = new Date();

  try {
    const path = resolveOutboxPath();
    await mkdir(dirname(path), { recursive: true });

    const payload = notifications
      .map((row) =>
        JSON.stringify({
          to: row.emailTo,
          subject: row.emailSubject,
          body: row.emailBody,
          commentId: row.commentId,
          recipientUserId: row.recipientUserId,
          sentAt: sentAt.toISOString(),
        } satisfies OutboxLine),
      )
      .join("\n");

    await appendFile(path, `${payload}\n`, "utf8");
    await markNotificationsEmailed(
      notifications.map((row) => row.id),
      sentAt,
    );
  } catch (error) {
    console.error("outbox: failed to write mention email", error);
  }
}
