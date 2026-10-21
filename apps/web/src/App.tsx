/**
 * Puerta de sesión de la app.
 *
 * `authClient.useSession()` lee la cookie de Better Auth. Es la única
 * excepción a TanStack Query: no va envuelta en `useQuery`. Sin sesión
 * se muestran los formularios. Con sesión, el nombre del usuario y la
 * card de health (`useHealth` vive dentro de `HealthCard`).
 */
import { useState } from "react";

import { AuthForms } from "@/components/auth-forms.tsx";
import { HealthCard } from "@/components/health-card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { authClient } from "@/lib/auth-client.ts";

/** Componente raíz. La sesión se lee siempre, también mientras carga. */
export default function App() {
  const { data, isPending } = authClient.useSession();

  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-6">
      {isPending ? (
        <SessionSkeleton />
      ) : data ? (
        <SignedIn name={data.user.name} email={data.user.email} />
      ) : (
        <AuthForms />
      )}
    </main>
  );
}

/** Placeholder mientras Better Auth resuelve la cookie de sesión. */
function SessionSkeleton() {
  return (
    <Card className="w-full max-w-md" aria-busy="true">
      <CardHeader>
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

/** Cabecera con el usuario y, debajo, el health del starter. */
function SignedIn({ name, email }: { name: string; email: string }) {
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await authClient.signOut();
    } catch {
      // Sin red la sesión no cambia. El botón vuelve a activarse en finally.
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-medium">{name}</p>
          <p className="truncate text-sm text-muted-foreground">{email}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={signingOut}
          aria-busy={signingOut}
          onClick={() => {
            void handleSignOut();
          }}
        >
          Cerrar sesión
        </Button>
      </header>
      <HealthCard />
    </div>
  );
}
