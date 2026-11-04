/**
 * Único punto de entrada para enviar correo.
 *
 * Hoy solo escribe en el outbox local (`outbox.ts`); el paso 06 añadirá aquí
 * el transporte de Cloudflare Email Service sin cambiar las llamadas. Nunca
 * lanza: devuelve `true` si la entrega fue bien y registra el error si no.
 */
import { writeToOutbox } from "./outbox.ts";

export type OutgoingEmail = {
  notificationId: string;
  to: string;
  subject: string;
  text: string;
};

export async function deliverEmail(email: OutgoingEmail): Promise<boolean> {
  try {
    await writeToOutbox(email);
    return true;
  } catch (error) {
    console.error(`No se pudo entregar el correo de ${email.notificationId}`, error);
    return false;
  }
}
