/**
 * Formulario de registro (email + contraseña + nombre).
 *
 * Estado local con `useState`. No usa React Hook Form.
 * Valida con `signUpSchema` antes de llamar a `authClient.signUp.email`.
 * Better Auth valida el servidor (email duplicado, etc.).
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
import { signUpSchema, type SignUpInput } from "@agentic-kanban/schemas";
import { useState } from "react";
import { toast } from "sonner";

/** Props: callback tras registro exitoso. */
export function SignUpForm({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState<SignUpInput>({
    email: "",
    password: "",
    name: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const result = signUpSchema.safeParse(form);
    if (!result.success) {
      setErrors(zodResolver(result.error));
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const { error } = await authClient.signUp.email({
        email: result.data.email,
        password: result.data.password,
        name: result.data.name,
      });

      if (error) {
        toast.error(error.message ?? "No se pudo registrar");
        return;
      }

      toast.success("Cuenta creada");
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
        <CardTitle className="text-2xl">Crear cuenta</CardTitle>
        <CardDescription>Regístrate con email y contraseña</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signup-name">Nombre</Label>
            <Input
              id="signup-name"
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              aria-invalid={!!errors.name}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-email">Email</Label>
            <Input
              id="signup-email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              aria-invalid={!!errors.email}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-password">Contraseña</Label>
            <Input
              id="signup-password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              aria-invalid={!!errors.password}
            />
            {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creando…" : "Crear cuenta"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
