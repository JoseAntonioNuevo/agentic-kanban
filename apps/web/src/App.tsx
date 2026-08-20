/**
 * Pantalla principal: muestra health si hay sesión, o login/registro si no.
 *
 * `useSession()` de Better Auth gestiona el estado de sesión en el cliente.
 * No hay React Router: el cambio de vista es estado local.
 */
import { BoardScreen } from "@/components/board-screen.tsx";
import { NotificationBell } from "@/components/notification-bell.tsx";
import { SignInForm } from "@/components/sign-in-form.tsx";
import { SignUpForm } from "@/components/sign-up-form.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { useHealth } from "@/hooks/use-health.ts";
import { useWorkspaces } from "@/hooks/use-workspaces.ts";
import { authClient } from "@/lib/auth-client.ts";
import { workspaceAccentClass } from "@/lib/workspace-accent.ts";
import { cn } from "@/lib/utils.ts";
import type { Workspace } from "@agentic-kanban/schemas";
import { useState } from "react";

type View = "signin" | "signup" | "dashboard";

/** Componente raíz: decide la vista según sesión y estado local. */
export default function App() {
  const health = useHealth();
  const session = authClient.useSession();
  const workspaces = useWorkspaces(session.data?.user.id);
  const [view, setView] = useState<View>("signin");
  const [projectId, setProjectId] = useState<string | undefined>();

  if (session.isPending) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-background p-6">
        <Skeleton className="h-40 w-full max-w-md" />
      </main>
    );
  }

  if (!session.data) {
    if (view === "signup") {
      return (
        <main className="flex min-h-svh items-center justify-center bg-background p-6">
          <SignUpForm onSuccess={() => setView("dashboard")} />
        </main>
      );
    }
    return (
      <main className="flex min-h-svh items-center justify-center bg-background p-6">
        <div className="space-y-4">
          <SignInForm onSuccess={() => setView("dashboard")} />
          <p className="text-center text-sm text-muted-foreground">
            ¿No tienes cuenta?{" "}
            <Button variant="link" onClick={() => setView("signup")}>
              Regístrate
            </Button>
          </p>
        </div>
      </main>
    );
  }

  if (projectId) {
    return (
      <BoardScreen
        projectId={projectId}
        userId={session.data.user.id}
        onBack={() => setProjectId(undefined)}
      />
    );
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5">
              <CardTitle className="text-2xl">Agentic Kanban</CardTitle>
              <CardDescription>Hola, {session.data.user.name}</CardDescription>
            </div>
            <NotificationBell userId={session.data.user.id} />
          </div>
        </CardHeader>
        <CardContent>
          <dl className="space-y-3">
            <StatusRow label="Frontend" ok />
            <StatusRow label="API" ok={health.isSuccess && health.data.api === "ok"} />
            <StatusRow label="Database" ok={health.isSuccess && health.data.database === "ok"} />
          </dl>
          <WorkspaceList
            isPending={workspaces.isPending}
            items={workspaces.data ?? []}
            onOpenProject={setProjectId}
          />
          <Button
            variant="outline"
            className="mt-4 w-full"
            onClick={async () => {
              await authClient.signOut();
              setView("signin");
            }}
          >
            Cerrar sesión
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

/** Lista de workspaces del usuario. El acento es de `workspace.id`, no del login. */
function WorkspaceList({
  isPending,
  items,
  onOpenProject,
}: {
  isPending: boolean;
  items: Workspace[];
  onOpenProject: (projectId: string) => void;
}) {
  return (
    <section className="mt-4 space-y-2">
      <h2 className="text-sm font-medium text-muted-foreground">Workspaces</h2>
      {isPending ? (
        <Skeleton className="h-11 w-full" />
      ) : items.length === 0 ? (
        <p className="rounded-lg border px-3 py-2 text-sm text-muted-foreground">
          Aún no perteneces a ningún workspace.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((workspace) => {
            const project = workspace.projects[0];
            return (
              <li key={workspace.id}>
                <button
                  type="button"
                  disabled={!project}
                  onClick={() => {
                    if (project) {
                      onOpenProject(project.id);
                    }
                  }}
                  className="flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "size-2.5 shrink-0 rounded-full",
                      workspaceAccentClass(workspace.id),
                    )}
                  />
                  <span className="text-sm font-medium">{workspace.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
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
