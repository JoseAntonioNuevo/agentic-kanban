/**
 * Contrato de eventos del tablero.
 *
 * Describe los anuncios del tablero que la API publicará y que el navegador
 * parseará con este mismo schema. Las escrituras siguen siendo HTTP: este
 * contrato solo anuncia lo ocurrido, no es una API de escritura. En
 * `task.moved`, `columnId` y `position` son los valores finales.
 */
import { z } from "zod";

import { moveTaskBodySchema, taskSchema } from "./board.ts";

/** Campos comunes: proyecto afectado y usuario que originó el cambio. */
const base = {
  projectId: z.string().min(1),
  actorUserId: z.string().min(1),
};

/** Anuncio del tablero: unión discriminada por `type`. */
export const boardEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("task.created"), ...base, task: taskSchema }),
  z.object({ type: z.literal("task.updated"), ...base, task: taskSchema }),
  z.object({ type: z.literal("task.deleted"), ...base, taskId: z.string().min(1) }),
  z.object({
    type: z.literal("task.moved"),
    ...base,
    taskId: z.string().min(1),
    ...moveTaskBodySchema.shape,
  }),
]);

export type BoardEvent = z.infer<typeof boardEventSchema>;
