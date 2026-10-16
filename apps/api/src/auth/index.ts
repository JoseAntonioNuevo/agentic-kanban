/**
 * Instancia de Better Auth (email + contraseña, sesión por cookie httpOnly).
 *
 * Usa el mismo libSQL que el resto de la API a través de `@agentic-kanban/db`.
 * `baseURL` apunta a Vite+ (5173): el navegador habla con el proxy, que
 * reenvía `/api` a Hono. El rate limit integrado está apagado porque lo
 * hace `authRateLimit` (ver `rate-limit.ts`).
 */
import { getDb, schema } from "@agentic-kanban/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

export const auth = betterAuth({
  database: drizzleAdapter(getDb(), { provider: "sqlite", schema }),
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:5173",
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: { enabled: true },
  trustedOrigins: ["http://localhost:5173", "http://127.0.0.1:5173"],
  rateLimit: { enabled: false },
});
