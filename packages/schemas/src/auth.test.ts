/**
 * Prueba los contratos de registro e inicio de sesión: un parse válido
 * (con recorte de nombre y email) y los rechazos.
 * Los tests de Vite+ se importan desde `vite-plus/test`, no desde Vitest.
 */
import { describe, expect, it } from "vite-plus/test";

import { signInInputSchema, signUpInputSchema } from "./auth.ts";

const validSignUp = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  password: "password1",
};

describe("signUpInputSchema", () => {
  it("acepta un registro válido y recorta nombre y email", () => {
    expect(
      signUpInputSchema.parse({
        name: "  Ada Lovelace  ",
        email: "  ada@example.com  ",
        password: "  password  ",
      }),
    ).toEqual({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "  password  ",
    });
  });

  it("acepta contraseñas de 8 y de 128 caracteres", () => {
    const eight = "a".repeat(8);
    const max = "a".repeat(128);

    expect(signUpInputSchema.parse({ ...validSignUp, password: eight }).password).toBe(eight);
    expect(signUpInputSchema.parse({ ...validSignUp, password: max }).password).toBe(max);
  });

  it("rechaza una contraseña de 7 caracteres", () => {
    expect(() => signUpInputSchema.parse({ ...validSignUp, password: "a".repeat(7) })).toThrow(
      /La contraseña debe tener al menos 8 caracteres/,
    );
  });

  it("rechaza una contraseña de 129 caracteres", () => {
    expect(() => signUpInputSchema.parse({ ...validSignUp, password: "a".repeat(129) })).toThrow(
      /La contraseña no puede superar 128 caracteres/,
    );
  });

  it("rechaza un email no válido", () => {
    expect(() => signUpInputSchema.parse({ ...validSignUp, email: "no-es-un-email" })).toThrow(
      /Email no válido/,
    );
  });

  it("rechaza un nombre vacío o de solo espacios", () => {
    expect(() => signUpInputSchema.parse({ ...validSignUp, name: "" })).toThrow(
      /Introduce tu nombre/,
    );
    expect(() => signUpInputSchema.parse({ ...validSignUp, name: "   " })).toThrow(
      /Introduce tu nombre/,
    );
  });
});

describe("signInInputSchema", () => {
  it("acepta un inicio de sesión válido", () => {
    expect(
      signInInputSchema.parse({
        email: "  ada@example.com  ",
        password: "clave",
      }),
    ).toEqual({
      email: "ada@example.com",
      password: "clave",
    });
  });

  it("rechaza una contraseña vacía", () => {
    expect(() =>
      signInInputSchema.parse({
        email: "ada@example.com",
        password: "",
      }),
    ).toThrow(/Introduce tu contraseña/);
  });

  it("rechaza un email no válido", () => {
    expect(() =>
      signInInputSchema.parse({
        email: "no-es-un-email",
        password: "clave",
      }),
    ).toThrow(/Email no válido/);
  });
});
