/**
 * Formulario de acceso con modo login/registro conmutable.
 *
 * Estado local de React. Antes de llamar a Better Auth se valida la entrada
 * con los schemas compartidos; el error se muestra como texto plano.
 */
import { signInInputSchema, signUpInputSchema } from "@agentic-kanban/schemas";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { authClient } from "@/lib/auth-client.ts";

type Mode = "login" | "register";

/** Traduce el error del servidor a un mensaje para la persona usuaria. */
function serverErrorMessage(error: { status: number; message?: string }): string {
  if (error.status === 401) return "Email o contraseña incorrectos";
  if (error.status === 429) return "Demasiados intentos, espera un minuto";
  return error.message || "No se pudo completar la operación";
}

/** Card con el formulario; al tener éxito `useSession` refresca la pantalla. */
export function AuthForm() {
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isRegister = mode === "register";

  function switchMode() {
    setMode(isRegister ? "login" : "register");
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (isRegister) {
      const parsed = signUpInputSchema.safeParse({ name, email, password });
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? "Datos no válidos");
        return;
      }
      setSubmitting(true);
      try {
        const result = await authClient.signUp.email(parsed.data);
        if (result.error) setError(serverErrorMessage(result.error));
      } catch {
        setError("No se pudo conectar con el servidor");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    const parsed = signInInputSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Datos no válidos");
      return;
    }
    setSubmitting(true);
    try {
      const result = await authClient.signIn.email(parsed.data);
      if (result.error) setError(serverErrorMessage(result.error));
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">{isRegister ? "Crear cuenta" : "Iniciar sesión"}</CardTitle>
        <CardDescription>Agentic Kanban — thePower</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {isRegister ? (
            <div className="space-y-2">
              <Label htmlFor="auth-name">Nombre</Label>
              <Input
                id="auth-name"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={submitting}
              />
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="auth-email">Email</Label>
            <Input
              id="auth-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={submitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="auth-password">Contraseña</Label>
            <Input
              id="auth-password"
              type="password"
              autoComplete={isRegister ? "new-password" : "current-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={submitting}
            />
          </div>
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Enviando…" : isRegister ? "Registrarme" : "Entrar"}
          </Button>
          <Button
            type="button"
            variant="link"
            className="w-full"
            onClick={switchMode}
            disabled={submitting}
          >
            {isRegister ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
