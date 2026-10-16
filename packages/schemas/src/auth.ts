/**
 * Contratos Zod de los formularios de registro y login.
 *
 * La web los usa con `safeParse` antes de llamar a Better Auth; el servidor
 * sigue validando por su cuenta. `z.infer` deriva los tipos de entrada.
 */
import { z } from "zod";

/** Email normalizado: sin espacios, en minúsculas y con formato válido. */
const emailSchema = z.string().trim().toLowerCase().pipe(z.email());

/** Registro: nombre visible, email y contraseña de 8 a 128 caracteres. */
export const signUpInputSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: emailSchema,
  password: z.string().min(8).max(128),
});

/** Login: la contraseña solo debe venir informada (el servidor la comprueba). */
export const signInInputSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

export type SignUpInput = z.infer<typeof signUpInputSchema>;
export type SignInInput = z.infer<typeof signInInputSchema>;
