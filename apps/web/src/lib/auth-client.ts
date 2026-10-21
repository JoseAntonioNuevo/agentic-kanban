/**
 * Cliente de Better Auth en el navegador.
 *
 * Sin `baseURL`: en el browser la librería usa `window.location.origin`
 * más `/api/auth`. La petición sale del mismo origen que la página
 * (`http://localhost:5173`), sin CORS, y la cookie httpOnly viaja con
 * el proxy de Vite+.
 */
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();
