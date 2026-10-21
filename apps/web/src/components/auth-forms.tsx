/**
 * Registro e inicio de sesión con estado local de React.
 *
 * Alterna entre crear cuenta e iniciar sesión sin router. Valida con los
 * schemas compartidos (`safeParse`) y, si pasan, llama a Better Auth.
 * El mensaje de campo es el primer issue del schema. `useSession` se
 * actualiza solo tras un sign-in o sign-up correctos.
 */
import { signInInputSchema, signUpInputSchema } from "@agentic-kanban/schemas";
import { useState, type ChangeEvent, type ComponentProps, type FormEvent } from "react";

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

type AuthMode = "sign-up" | "sign-in";

type AuthCallError = {
  status: number;
  message?: string | undefined;
};

const GENERIC_AUTH_ERROR = "No se pudo completar la operación.";

/** Formularios de alta y de acceso. El modo vive en `useState`. */
export function AuthForms() {
  const [mode, setMode] = useState<AuthMode>("sign-up");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isSignUp = mode === "sign-up";
  const title = isSignUp ? "Crear cuenta" : "Iniciar sesión";
  const pendingLabel = isSignUp ? "Creando cuenta…" : "Iniciando sesión…";
  const switchHint = isSignUp ? "¿Ya tienes cuenta?" : "¿No tienes cuenta?";
  const switchLabel = isSignUp ? "Iniciar sesión" : "Crear cuenta";

  function change(setValue: (value: string) => void) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      setValue(event.target.value);
      setError(null);
    };
  }

  function switchMode() {
    if (submitting) return;
    setMode(isSignUp ? "sign-in" : "sign-up");
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setError(null);

    if (isSignUp) {
      const parsed = signUpInputSchema.safeParse({ name, email, password });
      if (!parsed.success) {
        setError(firstIssueMessage(parsed.error));
        return;
      }

      setSubmitting(true);
      try {
        const result = await authClient.signUp.email(parsed.data);
        if (result.error) {
          setError(messageFromAuthError(result.error, "sign-up"));
        }
      } catch {
        setError(GENERIC_AUTH_ERROR);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    const parsed = signInInputSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(firstIssueMessage(parsed.error));
      return;
    }

    setSubmitting(true);
    try {
      const result = await authClient.signIn.email(parsed.data);
      if (result.error) {
        setError(messageFromAuthError(result.error, "sign-in"));
      }
    } catch {
      setError(GENERIC_AUTH_ERROR);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>
          {isSignUp
            ? "Crea tu cuenta con email y contraseña."
            : "Entra con el email y la contraseña de tu cuenta."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-4"
          noValidate
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
        >
          {isSignUp ? (
            <Field
              id="name"
              name="name"
              label="Nombre"
              autoComplete="name"
              value={name}
              disabled={submitting}
              onChange={change(setName)}
            />
          ) : null}
          <Field
            id="email"
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            disabled={submitting}
            onChange={change(setEmail)}
          />
          <Field
            id="password"
            name="password"
            label="Contraseña"
            type="password"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            value={password}
            disabled={submitting}
            onChange={change(setPassword)}
          />
          {error !== null ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <Button type="submit" disabled={submitting} aria-busy={submitting}>
            {submitting ? pendingLabel : title}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {switchHint}{" "}
            <Button
              type="button"
              variant="link"
              className="h-auto px-1 py-0"
              disabled={submitting}
              onClick={switchMode}
            >
              {switchLabel}
            </Button>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({
  id,
  label,
  ...inputProps
}: {
  id: string;
  label: string;
} & ComponentProps<typeof Input>) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} {...inputProps} />
    </div>
  );
}

function firstIssueMessage(error: { issues: readonly { message: string }[] }): string {
  return error.issues[0]?.message ?? "Revisa los datos del formulario.";
}

function messageFromAuthError(error: AuthCallError, mode: AuthMode): string {
  if (error.status === 429) {
    return "Demasiados intentos. Espera un minuto y vuelve a probar.";
  }
  if (mode === "sign-in" && error.status === 401) {
    return "Email o contraseña incorrectos.";
  }
  return error.message ?? GENERIC_AUTH_ERROR;
}
