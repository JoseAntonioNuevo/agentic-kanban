/**
 * Notificación de un usuario por un comentario (por ahora solo `mention`).
 *
 * Guarda el correo ya redactado (`email_to`, `email_subject`, `email_body`)
 * y `emailed_at` nulo hasta que se envíe; `read_at` nulo hasta que se lea.
 * Lleva su `workspace_id`. Todas las claves foráneas usan
 * `onDelete: "cascade"`: borrar la tarea, el comentario o el usuario no debe
 * fallar ni dejar notificaciones huérfanas.
 */
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { user } from "./auth.ts";
import { task } from "./board.ts";
import { comment } from "./comment.ts";
import { nowMs } from "./timestamps.ts";
import { workspace } from "./workspace.ts";

export const notification = sqliteTable(
  "notification",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    recipientUserId: text("recipient_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    actorUserId: text("actor_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    taskId: text("task_id")
      .notNull()
      .references(() => task.id, { onDelete: "cascade" }),
    commentId: text("comment_id")
      .notNull()
      .references(() => comment.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    readAt: integer("read_at", { mode: "timestamp_ms" }),
    emailTo: text("email_to").notNull(),
    emailSubject: text("email_subject").notNull(),
    emailBody: text("email_body").notNull(),
    emailedAt: integer("emailed_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(nowMs()),
  },
  (table) => [
    index("notification_recipientUserId_createdAt_idx").on(table.recipientUserId, table.createdAt),
    index("notification_workspaceId_idx").on(table.workspaceId),
  ],
);
