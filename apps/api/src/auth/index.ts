/**
 * Instancia de Better Auth para la API.
 *
 * Usa `drizzleAdapter` con `provider: "sqlite"` sobre el mismo fichero
 * libSQL que usa Drizzle (el `data/agentic-kanban.db`). El schema se pasa
 * explícito para que el adapter sepa mapear nombres de modelo a tablas.
 *
 * `trustedOrigins` permite peticiones desde el dev server de Vite+ (5173)
 * tanto en `localhost` como en `127.0.0.1`. `BETTER_AUTH_URL` apunta a 5173
 * porque el navegador habla con el frontend, y el proxy de Vite+ reenvía
 * `/api` a la API.
 *
 * Cookies: Better Auth emite cookies httpOnly por defecto; no hace falta
 * configurar nada extra para dev local.
 *
 * No envolvemos `/api/auth/*` con `@hono/zod-validator`: Better Auth valida
 * el servidor. Los schemas Zod (`@agentic-kanban/schemas`) solo validan
 * en el cliente antes de llamar a `signUp.email` / `signIn.email`.
 */
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { authSchema, getDb } from "@agentic-kanban/db";
import { betterAuth } from "better-auth";

/**
 * Instancia única de Better Auth.
 * `getDb()` abre el cliente libSQL de forma lazy, así que no tocamos el
 * fichero al importar este módulo.
 */
export const auth = betterAuth({
  database: drizzleAdapter(getDb(), {
    provider: "sqlite",
    schema: authSchema,
  }),
  trustedOrigins: ["http://localhost:5173", "http://127.0.0.1:5173"],
  emailAndPassword: {
    enabled: true,
  },
});

export type Session = typeof auth.$Infer.Session;
