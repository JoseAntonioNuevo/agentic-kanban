/**
 * Prueba los contratos de registro y login: parses válidos y rechazos.
 * Los tests de Vite+ se importan desde `vite-plus/test`, no desde Vitest.
 */
import { describe, expect, it } from "vite-plus/test";

import { signInInputSchema, signUpInputSchema } from "./auth.ts";

const validSignUp = { name: "Ada Lovelace", email: "ada@example.com", password: "12345678" };

describe("signUpInputSchema", () => {
  it("acepta un registro válido", () => {
    expect(signUpInputSchema.parse(validSignUp)).toEqual(validSignUp);
  });

  it("normaliza nombre y email", () => {
    expect(
      signUpInputSchema.parse({ ...validSignUp, name: "  Ada  ", email: "  ADA@Example.com " }),
    ).toEqual({ ...validSignUp, name: "Ada" });
  });

  it("rechaza un email inválido", () => {
    expect(signUpInputSchema.safeParse({ ...validSignUp, email: "no-es-email" }).success).toBe(
      false,
    );
  });

  it("rechaza una contraseña de 7 caracteres", () => {
    expect(signUpInputSchema.safeParse({ ...validSignUp, password: "1234567" }).success).toBe(
      false,
    );
  });

  it("acepta 128 caracteres y rechaza 129", () => {
    expect(signUpInputSchema.safeParse({ ...validSignUp, password: "a".repeat(128) }).success).toBe(
      true,
    );
    expect(signUpInputSchema.safeParse({ ...validSignUp, password: "a".repeat(129) }).success).toBe(
      false,
    );
  });

  it("rechaza un nombre vacío o solo con espacios", () => {
    expect(signUpInputSchema.safeParse({ ...validSignUp, name: "" }).success).toBe(false);
    expect(signUpInputSchema.safeParse({ ...validSignUp, name: "   " }).success).toBe(false);
  });
});

describe("signInInputSchema", () => {
  it("acepta un login válido", () => {
    expect(signInInputSchema.parse({ email: "ada@example.com", password: "x" })).toEqual({
      email: "ada@example.com",
      password: "x",
    });
  });

  it("rechaza un login sin contraseña", () => {
    expect(signInInputSchema.safeParse({ email: "ada@example.com", password: "" }).success).toBe(
      false,
    );
    expect(signInInputSchema.safeParse({ email: "ada@example.com" }).success).toBe(false);
  });

  it("rechaza un email inválido", () => {
    expect(signInInputSchema.safeParse({ email: "nope", password: "x" }).success).toBe(false);
  });
});
