import { db, schema } from "@agentic-kanban/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

const classroomSecret = "local-dev-only-change-in-session-1";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET ?? classroomSecret,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:5173",
  trustedOrigins: ["http://localhost:5173", "http://localhost:3000"],
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  rateLimit: {
    enabled: process.env.VITEST !== "true",
  },
});
