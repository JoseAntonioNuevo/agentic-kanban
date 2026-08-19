/**
 * Formulario de login (email + contraseña).
 *
 * Estado local con `useState`. No usa React Hook Form.
 * Valida con `signInSchema` antes de llamar a `authClient.signIn.email`.
 * Better Auth verifica las credenciales en el servidor.
 */
import { zodResolver } from "@/lib/zod-resolver.ts";
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
import { signInSchema, type SignInInput } from "@agentic-kanban/schemas";
import { useState } from "react";
import { toast } from "sonner";

/** Props: callback tras login exitoso. */
export function SignInForm({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState<SignInInput>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const result = signInSchema.safeParse(form);
    if (!result.success) {
      setErrors(zodResolver(result.error));
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const { error } = await authClient.signIn.email({
        email: result.data.email,
        password: result.data.password,
      });

      if (error) {
        toast.error(error.message ?? "No se pudo iniciar sesión");
        return;
      }

      toast.success("Sesión iniciada");
      onSuccess();
    } catch {
      toast.error("Error de red");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Iniciar sesión</CardTitle>
        <CardDescription>Accede con tu email y contraseña</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signin-email">Email</Label>
            <Input
              id="signin-email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              aria-invalid={!!errors.email}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="signin-password">Contraseña</Label>
            <Input
              id="signin-password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              aria-invalid={!!errors.password}
            />
            {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Entrando…" : "Iniciar sesión"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
