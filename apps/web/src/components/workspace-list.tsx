/**
 * Lista de workspaces y proyectos del usuario con sesión.
 *
 * Los estados (carga, error, vacío, lista) tienen mensajes distintos.
 * El color del swatch sale solo del id del workspace.
 */
import type { Workspace } from "@agentic-kanban/schemas";

import { Button } from "@/components/ui/button.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { useWorkspaces } from "@/hooks/use-workspaces.ts";
import { cn } from "@/lib/utils.ts";
import { workspaceAccent } from "@/lib/workspace-accent.ts";

/** Dashboard de espacios. `userId` entra en la queryKey. Un proyecto abre su tablero. */
export function WorkspaceList({
  userId,
  onOpenProject,
}: {
  userId: string;
  onOpenProject: (projectId: string) => void;
}) {
  const workspaces = useWorkspaces(userId);

  return (
    <Card className={cn("w-full max-w-md")}>
      <CardHeader>
        <CardTitle>Espacios de trabajo</CardTitle>
        <CardDescription>Espacios a los que perteneces y sus proyectos.</CardDescription>
      </CardHeader>
      <CardContent>
        {workspaces.isPending ? (
          <LoadingWorkspaces />
        ) : workspaces.isError ? (
          <WorkspacesError
            onRetry={() => {
              void workspaces.refetch();
            }}
          />
        ) : workspaces.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Todavía no perteneces a ningún espacio de trabajo.
          </p>
        ) : (
          <WorkspaceItems workspaces={workspaces.data} onOpenProject={onOpenProject} />
        )}
      </CardContent>
    </Card>
  );
}

/** Skeleton y texto propios de la carga. No reutiliza el mensaje de error ni el de vacío. */
function LoadingWorkspaces() {
  return (
    <div className="space-y-3" aria-busy="true">
      <p className="text-sm text-muted-foreground">Cargando espacios de trabajo…</p>
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
    </div>
  );
}

/** Error de red o de contrato, con reintento de la misma query. */
function WorkspacesError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="space-y-3" role="alert">
      <p className="text-sm">No se pudieron cargar tus espacios de trabajo.</p>
      <Button type="button" variant="outline" onClick={onRetry}>
        Reintentar
      </Button>
    </div>
  );
}

/** Un ítem por workspace: swatch, nombre y un botón por proyecto. */
function WorkspaceItems({
  workspaces,
  onOpenProject,
}: {
  workspaces: readonly Workspace[];
  onOpenProject: (projectId: string) => void;
}) {
  return (
    <ul className="space-y-3">
      {workspaces.map((workspace) => (
        <li key={workspace.id} className={cn("rounded-lg border px-3 py-2")}>
          <div className="flex items-center gap-2">
            <span
              className="size-4 shrink-0 rounded-full"
              style={{ backgroundColor: workspaceAccent(workspace.id) }}
              aria-hidden="true"
              data-workspace-id={workspace.id}
            />
            <p className="min-w-0 truncate text-sm font-medium">{workspace.name}</p>
          </div>
          {workspace.projects.length === 0 ? (
            <p className="mt-1 pl-6 text-sm text-muted-foreground">Sin proyectos</p>
          ) : (
            <ul className="mt-1 space-y-1 pl-6">
              {workspace.projects.map((project) => (
                <li key={project.id}>
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto px-0 text-sm text-muted-foreground"
                    onClick={() => {
                      onOpenProject(project.id);
                    }}
                  >
                    {project.name}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}
