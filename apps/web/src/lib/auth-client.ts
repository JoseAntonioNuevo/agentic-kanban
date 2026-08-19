/**
 * Cliente de Better Auth para React.
 *
 * Sin `baseURL`: el navegador llama a `/api/auth/...` (URL relativa) y el
 * proxy de Vite+ reenvía a la API Hono. `fetchOptions.credentials` envía
 * la cookie de sesión httpOnly en cada petición.
 */
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  fetchOptions: {
    credentials: "include",
  },
});

export const { signIn, signOut, signUp, useSession } = authClient;
