/**
 * Notificaciones: marca de envío del email de aula.
 *
 * Las filas nacen dentro de la transacción del comentario
 * (`createCommentForMember`); aquí solo se actualiza `emailed_at` cuando el
 * llamador ya confirmó la escritura del outbox.
 */
import { inArray } from "drizzle-orm";

import { getDb } from "../client.ts";
import { notification } from "../schema/index.ts";

/** Marca `emailed_at = at` en las notificaciones con esos ids (no hace nada si no hay ids). */
export async function markNotificationsEmailed(ids: string[], at: Date): Promise<void> {
  if (ids.length === 0) {
    return;
  }

  await getDb().update(notification).set({ emailedAt: at }).where(inArray(notification.id, ids));
}
