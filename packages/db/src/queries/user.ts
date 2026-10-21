/**
 * Lectura del usuario por email, para reutilizar un id ya creado.
 *
 * Better Auth persiste el email en minúsculas. La búsqueda hace lo mismo.
 */
import { eq } from "drizzle-orm";

import { db } from "../client.ts";
import { user } from "../schema/auth.ts";

export async function findUserIdByEmail(email: string): Promise<string | undefined> {
  const normalizedEmail = email.toLowerCase();
  const rows = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, normalizedEmail))
    .limit(1);

  return rows[0]?.id;
}
