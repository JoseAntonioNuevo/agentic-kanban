/**
 * Puerta de sesión de la app.
 *
 * `authClient.useSession()` lee la cookie de Better Auth. Es la única
 * excepción a TanStack Query: no va envuelta en `useQuery`. Sin sesión
 * se muestran los formularios y no se monta la lista de workspaces.
 * Con sesión, el nombre del usuario, la card de health y los espacios.
 * Un proyecto abre su tablero (`selectedProjectId`); no hay router, pero
 * `useSelectedProject` lo guarda en `?project=` para recargar o compartir.
 * El userId de la sesión limpia la caché privada al cambiar de identidad.
 * Al cerrar sesión la lista se desmonta antes de la petición: `signOut`
 * resuelve mientras `useSession` aún tiene datos.
 */
import { useState } from "react";
import { flushSync } from "react-dom";

import { AuthForms } from "@/components/auth-forms.tsx";
import { BoardScreen } from "@/components/board-screen.tsx";
import { HealthCard } from "@/components/health-card.tsx";
import { WorkspaceList } from "@/components/workspace-list.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { useIdentityCacheReset } from "@/hooks/use-identity-cache-reset.ts";
import { useSelectedProject } from "@/hooks/use-selected-project.ts";
import { authClient } from "@/lib/auth-client.ts";
import { queryClient } from "@/lib/query-client.ts";
import { signOutAndClearPrivateData } from "@/lib/sign-out.ts";
import { cn } from "@/lib/utils.ts";

/** Componente raíz. La sesión se lee siempre, también mientras carga. */
export default function App() {
  const { data, isPending } = authClient.useSession();
  const userId = data?.user.id ?? null;
  useIdentityCacheReset(userId);

  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-4 sm:p-6">
      {isPending ? (
        <SessionSkeleton />
      ) : data ? (
        <SignedIn
          key={data.user.id}
          name={data.user.name}
          email={data.user.email}
          userId={data.user.id}
        />
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

/** Cabecera con el usuario y, debajo, el dashboard o el tablero del proyecto elegido. */
function SignedIn({ name, email, userId }: { name: string; email: string; userId: string }) {
  const [signingOut, setSigningOut] = useState(false);
  const [privateVisible, setPrivateVisible] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useSelectedProject();

  async function handleSignOut() {
    setSigningOut(true);
    const succeeded = await signOutAndClearPrivateData({
      signOut: () => authClient.signOut(),
      queryClient,
      setPrivateVisible: (visible) => {
        flushSync(() => {
          setPrivateVisible(visible);
        });
      },
    });
    if (!succeeded) {
      setSigningOut(false);
    }
  }

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-4",
        selectedProjectId ? "max-w-6xl self-start" : "max-w-md",
      )}
    >
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
      {privateVisible ? (
        selectedProjectId ? (
          <BoardScreen
            projectId={selectedProjectId}
            userId={userId}
            onBack={() => {
              setSelectedProjectId(null);
            }}
          />
        ) : (
          <>
            <HealthCard />
            <WorkspaceList key={userId} userId={userId} onOpenProject={setSelectedProjectId} />
          </>
        )
      ) : null}
    </div>
  );
}
