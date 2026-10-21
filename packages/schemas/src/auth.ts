/**
 * Contratos Zod de registro e inicio de sesión.
 *
 * TypeScript tipa en compile-time; Zod valida en runtime (el formulario
 * llama a `.parse()` sobre el mismo schema). `z.infer` deriva el tipo
 * para no duplicar la forma a mano.
 */
import { z } from "zod";

/**
 * Email compartido: recorta espacios, admite como máximo 254 caracteres
 * y exige un email válido. `z.email()` no recorta, así que el trim va antes.
 */
const emailSchema = z
  .string({ error: "Email no válido" })
  .trim()
  .max(254, { error: "El email no puede superar 254 caracteres" })
  .pipe(z.email({ error: "Email no válido" }));

/**
 * Cuerpo de registro.
 * La contraseña se respeta tal cual (8–128, sin trim).
 */
export const signUpInputSchema = z.object({
  name: z
    .string({ error: "Introduce tu nombre" })
    .trim()
    .min(1, { error: "Introduce tu nombre" })
    .max(100, { error: "El nombre no puede superar 100 caracteres" }),
  email: emailSchema,
  password: z
    .string({ error: "Introduce tu contraseña" })
    .min(8, { error: "La contraseña debe tener al menos 8 caracteres" })
    .max(128, { error: "La contraseña no puede superar 128 caracteres" }),
});

export type SignUpInput = z.infer<typeof signUpInputSchema>;

/**
 * Cuerpo de login: el mismo email.
 * La contraseña solo exige estar presente; no aplica el mínimo de registro.
 */
export const signInInputSchema = z.object({
  email: emailSchema,
  password: z
    .string({ error: "Introduce tu contraseña" })
    .min(1, { error: "Introduce tu contraseña" })
    .max(128, { error: "La contraseña no puede superar 128 caracteres" }),
});

export type SignInInput = z.infer<typeof signInInputSchema>;
