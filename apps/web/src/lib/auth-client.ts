/**
 * Cliente de Better Auth para el navegador.
 *
 * Sin `baseURL`: usa URL relativa y mismo origen, así las llamadas a
 * `/api/auth/*` pasan por el proxy de Vite+ y no hay CORS.
 */
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();
