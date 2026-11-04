/**
 * Único punto de entrada para enviar correo.
 *
 * Con `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_EMAIL_TOKEN` y `MAIL_FROM` usa
 * Cloudflare Email Service (`cloudflare.ts`); si falta alguna, el outbox
 * local (`outbox.ts`). Nunca lanza: devuelve `true` si la entrega fue bien y
 * registra el error (sin el token) si no.
 */
import { readCloudflareMailConfig, sendWithCloudflare } from "./cloudflare.ts";
import { writeToOutbox } from "./outbox.ts";

export type OutgoingEmail = {
  notificationId: string;
  to: string;
  subject: string;
  text: string;
};

export async function deliverEmail(
  email: OutgoingEmail,
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  try {
    const config = readCloudflareMailConfig();
    if (config) {
      await sendWithCloudflare(email, config, fetchImpl);
    } else {
      await writeToOutbox(email);
    }
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : "error desconocido";
    console.error(`No se pudo entregar el correo de ${email.notificationId}: ${message}`);
    return false;
  }
}
