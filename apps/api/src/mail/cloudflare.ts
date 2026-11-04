/**
 * Transporte de Cloudflare Email Service por su API REST (fetch nativo).
 *
 * `POST /accounts/{id}/email/sending/send` con `Authorization: Bearer`. La
 * entrega es correcta si responde 2xx con `success: true` y el destinatario
 * no aparece en `result.permanent_bounces`. Si `MAIL_REDIRECT_TO` existe,
 * todo va a esa dirección y el cuerpo indica el destinatario original.
 * Lanza ante cualquier fallo; el mensaje nunca incluye el token.
 */
import type { OutgoingEmail } from "./index.ts";

export type CloudflareMailConfig = {
  accountId: string;
  token: string;
  from: string;
  redirectTo?: string;
};

type SendResponse = {
  success?: boolean;
  errors?: { code?: number; message?: string }[];
  result?: { permanent_bounces?: string[] };
};

/** Configuración desde el entorno, o `null` si falta alguna variable obligatoria. */
export function readCloudflareMailConfig(
  env: Record<string, string | undefined> = process.env,
): CloudflareMailConfig | null {
  const accountId = env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const token = env.CLOUDFLARE_EMAIL_TOKEN?.trim();
  const from = env.MAIL_FROM?.trim();
  if (!accountId || !token || !from) {
    return null;
  }
  return { accountId, token, from, redirectTo: env.MAIL_REDIRECT_TO?.trim() || undefined };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function sendWithCloudflare(
  email: OutgoingEmail,
  config: CloudflareMailConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const to = config.redirectTo ?? email.to;
  const text = config.redirectTo
    ? `[Destinatario original: ${email.to}]\n\n${email.text}`
    : email.text;
  const html = `<pre style="font-family:inherit;white-space:pre-wrap">${escapeHtml(text)}</pre>`;

  const response = await fetchImpl(
    `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(config.accountId)}/email/sending/send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: config.from, to, subject: email.subject, text, html }),
    },
  );

  let payload: SendResponse | null = null;
  try {
    payload = (await response.json()) as SendResponse;
  } catch {
    payload = null;
  }

  if (!response.ok || payload?.success !== true) {
    const detail = payload?.errors
      ?.map((e) => `${e.code ?? ""} ${e.message ?? ""}`.trim())
      .join("; ");
    throw new Error(
      `Cloudflare Email Service respondió ${response.status}${detail ? `: ${detail}` : ""}`,
    );
  }
  if (payload.result?.permanent_bounces?.includes(to)) {
    throw new Error(`Cloudflare Email Service rechazó el destinatario ${to} (permanent_bounces)`);
  }
}
