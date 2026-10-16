/**
 * Pantalla raíz: acceso con Better Auth y, con sesión, el estado del sistema.
 *
 * `authClient.useSession()` decide entre skeleton, formulario de acceso o
 * cabecera con usuario + card de health. No hay workspaces todavía.
 * `useHealth()` pide GET /api/health y Zod valida la respuesta. Frontend se
 * marca OK si el JS ha cargado; API y Database salen del JSON parseado.
 */
import { AuthForm } from "@/components/auth-form.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { useHealth } from "@/hooks/use-health.ts";
import { authClient } from "@/lib/auth-client.ts";

/** Componente raíz: elige pantalla según el estado de la sesión. */
export default function App() {
  const session = authClient.useSession();

  if (session.isPending) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-background p-6">
        <Skeleton className="h-48 w-full max-w-md" />
      </main>
    );
  }

  if (!session.data) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-background p-6">
        <AuthForm />
      </main>
    );
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background p-6">
      <header className="flex w-full max-w-md items-center justify-between">
        <span className="text-sm font-medium">{session.data.user.name}</span>
        <Button variant="outline" onClick={() => void authClient.signOut()}>
          Cerrar sesión
        </Button>
      </header>
      <HealthCard />
    </main>
  );
}

/** Card de health: espera la query y pinta las tres filas de estado. */
function HealthCard() {
  const health = useHealth();

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Agentic Kanban</CardTitle>
        <CardDescription>thePower — Desarrollo Agéntico</CardDescription>
      </CardHeader>
      <CardContent>
        {health.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : (
          <dl className="space-y-3">
            <StatusRow label="Frontend" ok />
            <StatusRow label="API" ok={health.isSuccess && health.data.api === "ok"} />
            <StatusRow label="Database" ok={health.isSuccess && health.data.database === "ok"} />
          </dl>
        )}
      </CardContent>
    </Card>
  );
}

/** Fila de estado: etiqueta a la izquierda y badge OK/Error a la derecha. */
function StatusRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border px-3 py-2">
      <dt className="text-sm font-medium">{label}</dt>
      <dd>
        <Badge variant={ok ? "default" : "destructive"}>{ok ? "OK" : "Error"}</Badge>
      </dd>
    </div>
  );
}
