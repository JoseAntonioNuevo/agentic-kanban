/**
 * Contratos Zod para los formularios de auth (solo cliente).
 *
 * Better Auth valida el servidor: estos schemas NO se envuelven sobre
 * `/api/auth/*`. Se usan en el frontend para validar el input antes de
 * llamar a `signUp.email` / `signIn.email`.
 *
 * Contraseña: mínimo 8 caracteres. El hash lo genera Better Auth en el
 * servidor; aquí solo comprobamos longitud básica.
 */
import { z } from "zod";

/** Formulario de registro: email, contraseña y nombre. */
export const signUpSchema = z.object({
  email: z.email("Email no válido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  name: z.string().min(1, "El nombre es obligatorio"),
});

/** Formulario de login: email y contraseña. */
export const signInSchema = z.object({
  email: z.email("Email no válido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
