/**
 * Redacción del correo de una mención.
 *
 * Asunto: «{actor} te mencionó en "{título}"». El cuerpo en texto lleva el
 * título, el comentario y el enlace al tablero en la app (`BETTER_AUTH_URL`,
 * con `?project=` como `useSelectedProject`).
 */
import type { MentionEmail, MentionEmailInput } from "@agentic-kanban/db";

function appUrl(): string {
  return (process.env.BETTER_AUTH_URL ?? "http://localhost:5173").replace(/\/+$/, "");
}

export function composeMentionEmail(input: MentionEmailInput): MentionEmail {
  const link = `${appUrl()}/?project=${encodeURIComponent(input.projectId)}`;
  return {
    subject: `${input.actorName} te mencionó en "${input.taskTitle}"`,
    text: [
      `Hola, ${input.recipientName}:`,
      "",
      `${input.actorName} te mencionó en la tarea "${input.taskTitle}":`,
      "",
      input.commentBody,
      "",
      `Ábrela en Agentic Kanban: ${link}`,
      "",
    ].join("\n"),
  };
}
