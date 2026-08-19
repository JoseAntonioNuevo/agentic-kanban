/**
 * Pruebas de los contratos de auth: sign-up y sign-in.
 * Validan casos correctos e incorrectos. Solo cubren validación del cliente.
 */
import { describe, expect, it } from "vite-plus/test";

import { signInSchema, signUpSchema } from "./auth.ts";

describe("signUpSchema", () => {
  it("acepta un registro válido", () => {
    expect(
      signUpSchema.parse({
        email: "ada@example.com",
        password: "secure123",
        name: "Ada",
      }),
    ).toEqual({
      email: "ada@example.com",
      password: "secure123",
      name: "Ada",
    });
  });

  it("rechaza una contraseña corta", () => {
    expect(() =>
      signUpSchema.parse({
        email: "ada@example.com",
        password: "short",
        name: "Ada",
      }),
    ).toThrow();
  });

  it("rechaza un email inválido", () => {
    expect(() =>
      signUpSchema.parse({
        email: "no-es-un-email",
        password: "secure123",
        name: "Ada",
      }),
    ).toThrow();
  });

  it("rechaza sin nombre", () => {
    expect(() =>
      signUpSchema.parse({
        email: "ada@example.com",
        password: "secure123",
        name: "",
      }),
    ).toThrow();
  });
});

describe("signInSchema", () => {
  it("acepta credenciales válidas", () => {
    expect(
      signInSchema.parse({
        email: "ada@example.com",
        password: "secure123",
      }),
    ).toEqual({
      email: "ada@example.com",
      password: "secure123",
    });
  });

  it("rechaza sin contraseña", () => {
    expect(() =>
      signInSchema.parse({
        email: "ada@example.com",
        password: "",
      }),
    ).toThrow();
  });

  it("rechaza un email inválido", () => {
    expect(() =>
      signInSchema.parse({
        email: "no-es-un-email",
        password: "secure123",
      }),
    ).toThrow();
  });
});
