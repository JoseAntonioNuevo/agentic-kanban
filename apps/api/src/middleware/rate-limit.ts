/**
 * Rate limiting in-memory para POST de sign-up y sign-in.
 *
 * No es persistente: al reiniciar la API se reinician los contadores. Solo
 * se aplica a `/api/auth/sign-up/email` y `/api/auth/sign-in/email`. El
 * `get-session` no se limita.
 *
 * Bucket por IP: `max` peticiones en `windowMs`. Si se excede, 429 con
 * `Retry-After`.
 */

interface RateBucket {
  /** Timestamps de las peticiones en la ventana actual. */
  hits: number[];
}

const buckets = new Map<string, RateBucket>();

/** Limpia buckets vacíos de vez en cuando para no crecer sin límite. */
const CLEANUP_INTERVAL_MS = 60_000;

/** Config del rate limiter de auth. */
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;

/**
 * Devuelve la IP del cliente. En dev directo es `x-forwarded-for` (proxy
 * de Vite+); en Compose es la IP del contenedor web.
 */
function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return "unknown";
}

/**
 * Comprueba si la petición puede pasar. Devuelve `true` si está dentro
 * del límite, `false` si se excedió.
 */
function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket) {
    buckets.set(key, { hits: [now] });
    return true;
  }

  // Filtra hits que ya cayeron fuera de la ventana.
  bucket.hits = bucket.hits.filter((time) => now - time < RATE_LIMIT_WINDOW_MS);

  if (bucket.hits.length >= RATE_LIMIT_MAX) {
    return false;
  }

  bucket.hits.push(now);
  return true;
}

/**
 * Middleware de rate limit para los endpoints de auth sensibles.
 * Si se excede el límite responde 429.
 */
export function rateLimitByIp() {
  return async (
    c: { req: { method: string; path: string; raw: Request } },
    next: () => Promise<void>,
  ) => {
    // Solo limita POST a sign-up / sign-in.
    if (c.req.method !== "POST") {
      await next();
      return;
    }

    const path = c.req.path;
    if (path !== "/api/auth/sign-up/email" && path !== "/api/auth/sign-in/email") {
      await next();
      return;
    }

    const ip = getClientIp(c.req.raw);
    if (!checkRateLimit(ip)) {
      return new Response(JSON.stringify({ message: "Demasiadas peticiones" }), {
        status: 429,
        headers: {
          "content-type": "application/json",
          "retry-after": String(Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)),
        },
      });
    }

    await next();
  };
}

/** Limpieza periódica de buckets expirados. */
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    bucket.hits = bucket.hits.filter((time) => now - time < RATE_LIMIT_WINDOW_MS);
    if (bucket.hits.length === 0) {
      buckets.delete(key);
    }
  }
}, CLEANUP_INTERVAL_MS).unref?.();
