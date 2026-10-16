/**
 * Rate limit en memoria para registro y login.
 *
 * Ventana fija de 60 s y máximo 10 peticiones por ruta. Detrás del proxy de
 * Vite+ no llega la IP real, así que hay un único bucket por ruta: basta para
 * el aula. `get-session` y el resto de rutas nunca se limitan.
 */
import { createMiddleware } from "hono/factory";

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;

/** Rutas `POST` sujetas al límite. */
const limitedPaths = new Set(["/api/auth/sign-up/email", "/api/auth/sign-in/email"]);

type Bucket = { windowStart: number; count: number };

const buckets = new Map<string, Bucket>();

/** Los tests y el entorno que lo pida desactivan el límite. */
function isRateLimitDisabled(): boolean {
  return process.env.NODE_ENV === "test" || process.env.AUTH_RATE_LIMIT_DISABLED === "1";
}

export const authRateLimit = createMiddleware(async (c, next) => {
  if (c.req.method !== "POST" || !limitedPaths.has(c.req.path) || isRateLimitDisabled()) {
    await next();
    return;
  }

  const now = Date.now();
  const current = buckets.get(c.req.path);
  const bucket: Bucket =
    current && now - current.windowStart < WINDOW_MS ? current : { windowStart: now, count: 0 };

  bucket.count += 1;
  buckets.set(c.req.path, bucket);

  if (bucket.count > MAX_REQUESTS) {
    const retryAfter = Math.ceil((bucket.windowStart + WINDOW_MS - now) / 1000);
    c.header("Retry-After", String(retryAfter));
    return c.json({ message: "Demasiados intentos, espera un minuto" }, 429);
  }

  await next();
});
