/**
 * Worker público: sirve el frontend y reenvía `/api/*` al Container.
 *
 * - `/api/*` (HTTP y WebSocket) va a la instancia `"main"` de `ApiContainer`
 *   con `stub.fetch(request)`. `containerFetch` es RPC y no deja pasar el
 *   upgrade del WebSocket.
 * - El resto va a `env.ASSETS` (build de apps/web, modo SPA).
 *
 * Siempre la misma instancia: el hub de eventos de la API vive en memoria y
 * todos los usuarios tienen que llegar al mismo proceso.
 */
import { Container, getContainer } from "@cloudflare/containers";

/** Nombre fijo de la única instancia del Container. */
const API_INSTANCE = "main";

/**
 * La API de Bun de apps/api, construida con apps/edge/Dockerfile.
 * Sus variables salen de los secretos del Worker; el disco es efímero.
 */
export class ApiContainer extends Container<Env> {
  defaultPort = 3000;
  sleepAfter = "4h";
  envVars = {
    BETTER_AUTH_SECRET: this.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: this.env.BETTER_AUTH_URL,
    DATABASE_URL: "file:/data/agentic-kanban.db",
    API_PORT: "3000",
    // Correo real por Email Service (secretos del Worker).
    CLOUDFLARE_ACCOUNT_ID: this.env.CLOUDFLARE_ACCOUNT_ID,
    CLOUDFLARE_EMAIL_TOKEN: this.env.CLOUDFLARE_EMAIL_TOKEN,
    MAIL_FROM: this.env.MAIL_FROM,
    MAIL_REDIRECT_TO: this.env.MAIL_REDIRECT_TO,
  };
  // Salida a internet: necesaria para llamar a la API de Email Service.
  enableInternet = true;
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname.startsWith("/api/")) {
      return getContainer(env.API, API_INSTANCE).fetch(request);
    }
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
