/**
 * Contrato Zod de los anuncios del tablero.
 *
 * Describe qué cambió después de una escritura HTTP; no es una API de
 * escritura. API y navegador parsean el mismo schema. Todas las variantes
 * llevan `projectId` y `actorUserId`; `task.moved` lleva la columna y la
 * posición finales. `comment.created` lleva el comentario recién creado y no
 * cambia el tablero: el cliente refresca el hilo y la campana.
 */
import { z } from "zod";

import { moveTaskBodySchema, taskIdParamSchema, taskSchema } from "./board.ts";
import { commentSchema } from "./comment.ts";

const eventBaseShape = {
  projectId: z.string().min(1),
  actorUserId: z.string().min(1),
};

const taskCreatedEventSchema = z.object({
  type: z.literal("task.created"),
  ...eventBaseShape,
  task: taskSchema,
});

const taskUpdatedEventSchema = z.object({
  type: z.literal("task.updated"),
  ...eventBaseShape,
  task: taskSchema,
});

const taskDeletedEventSchema = z.object({
  type: z.literal("task.deleted"),
  ...eventBaseShape,
  ...taskIdParamSchema.shape,
});

const taskMovedEventSchema = z.object({
  type: z.literal("task.moved"),
  ...eventBaseShape,
  ...taskIdParamSchema.shape,
  ...moveTaskBodySchema.shape,
});

const commentCreatedEventSchema = z.object({
  type: z.literal("comment.created"),
  ...eventBaseShape,
  comment: commentSchema,
});

/** Anuncio del tablero, discriminado por `type`. */
export const boardEventSchema = z.discriminatedUnion("type", [
  taskCreatedEventSchema,
  taskUpdatedEventSchema,
  taskDeletedEventSchema,
  taskMovedEventSchema,
  commentCreatedEventSchema,
]);

export type BoardEvent = z.infer<typeof boardEventSchema>;
