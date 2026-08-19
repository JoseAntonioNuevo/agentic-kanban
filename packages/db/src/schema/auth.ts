/**
 * Tablas de Better Auth para Drizzle (SQLite).
 *
 * Better Auth gestiona `user`, `session`, `account` y `verification`.
 * El adapter de Drizzle espera estas tablas con los nombres por defecto
 * (`user`, `session`, `account`, `verification`) y snake_case en las
 * columnas. Los timestamps usan `timestamp_ms` (ms desde epoch) que es
 * lo que el generador del adapter produce para SQLite.
 *
 * No añadir `workspace_id` aquí: estas tablas son de Better Auth y no son
 * de tenant. El aislamiento vive en `workspace` / `workspace_member` /
 * `project` / `column` / `task`.
 */
import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/** Tabla de usuario. Better Auth valida el email en el servidor. */
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull()
    .$onUpdate(() => new Date()),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).default(false).notNull(),
  name: text("name").notNull(),
  image: text("image"),
});

/** Sesión por cookie. `token` es lo que se guarda en la cookie httpOnly. */
export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull()
    .$onUpdate(() => new Date()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});

/**
 * Cuenta de autenticación. Para email+contraseña, `providerId` es
 * "credential" y `password` guarda el hash. Better Auth crea un issuer
 * sintético para cada provider.
 */
export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull()
    .$onUpdate(() => new Date()),
  providerId: text("provider_id").notNull(),
  issuer: text("issuer").notNull(),
  accountId: text("account_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp_ms" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp_ms" }),
  scope: text("scope"),
  password: text("password"),
});

/** Tokens de verificación (email, reset, etc.). Expiran solos. */
export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull()
    .$onUpdate(() => new Date()),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  identifier: text("identifier").notNull(),
});
