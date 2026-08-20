/**
 * Notificación de tenant (por ahora solo kind `mention`). Pertenece al
 * workspace. `recipient_user_id` / `actor_user_id` son `user.id`.
 * `email_*` se rellenan al crear una mención; `emailed_at` tras escribir
 * el outbox. `read_at` lo pone la campana (`POST …/read`).
 */
import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { user } from "./auth.ts";
import { comment } from "./comment.ts";
import { task } from "./task.ts";
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
    emailTo: text("email_to").notNull().default(""),
    emailSubject: text("email_subject").notNull().default(""),
    emailBody: text("email_body").notNull().default(""),
    emailedAt: integer("emailed_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index("notification_workspace_id_idx").on(table.workspaceId),
    index("notification_recipient_user_id_idx").on(table.recipientUserId),
  ],
);
