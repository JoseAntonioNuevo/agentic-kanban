/**
 * Autenticación con Better Auth: email y contraseña, sesión por cookie httpOnly.
 *
 * El navegador habla con Vite+ (`http://localhost:5173`); el proxy reenvía
 * `/api` aquí. `basePath` por defecto es `/api/auth`. El secreto no se
 * escribe en código: Better Auth lo lee de `BETTER_AUTH_SECRET`.
 *
 * `customRules` se recorre con `Object.keys().find`: gana la primera clave
 * que coincide, así que `"**": false` va la última y deja get-session,
 * sign-out y el resto sin límite. Detrás del proxy de Vite no llega la IP
 * (`x-forwarded-for`); el límite cae en un bucket compartido
 * `no-trusted-ip|<ruta>`, suficiente para el aula.
 */
import { authSchema, db } from "@agentic-kanban/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

/** Entero positivo de `AUTH_RATE_LIMIT_MAX`; si falta o no vale, 10. */
function readAuthRateLimitMax(): number {
  const parsed = Number(process.env.AUTH_RATE_LIMIT_MAX);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return 10;
  }
  return parsed;
}

const authRateLimitMax = readAuthRateLimitMax();

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:5173",
  trustedOrigins: ["http://localhost:5173", "http://127.0.0.1:5173"],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: authSchema,
  }),
  rateLimit: {
    enabled: true,
    storage: "memory",
    window: 60,
    max: authRateLimitMax,
    customRules: {
      "/sign-up/email": { window: 60, max: authRateLimitMax },
      "/sign-in/email": { window: 60, max: authRateLimitMax },
      // Última a propósito: cualquier otra ruta queda sin límite.
      "**": false,
    },
  },
});
