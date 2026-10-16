/**
 * Lista de workspaces del usuario con sus projects. Cada project es un botón
 * que llama a `onOpenProject(projectId)` para abrir su tablero.
 *
 * Tres estados con mensaje propio: cargando (skeleton), error y lista vacía
 * (que es un resultado válido). El swatch usa `workspaceAccent(w.id)`: el
 * color depende solo del id del workspace.
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { useWorkspaces } from "@/hooks/use-workspaces.ts";
import { workspaceAccent } from "@/lib/workspace-accent.ts";

/** Pinta los espacios del usuario identificado por `userId`. */
export function WorkspaceList({
  userId,
  onOpenProject,
}: {
  userId: string;
  onOpenProject: (projectId: string) => void;
}) {
  const workspaces = useWorkspaces(userId);

  if (workspaces.isPending) {
    return (
      <div className="w-full max-w-md space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (workspaces.isError) {
    return (
      <p role="alert" className="w-full max-w-md text-sm text-destructive">
        No se pudieron cargar tus espacios
      </p>
    );
  }

  if (workspaces.data.length === 0) {
    return (
      <p className="w-full max-w-md text-sm text-muted-foreground">
        Todavía no perteneces a ningún espacio
      </p>
    );
  }

  return (
    <ul className="w-full max-w-md space-y-3">
      {workspaces.data.map((workspace) => {
        const accent = workspaceAccent(workspace.id);

        return (
          <li key={workspace.id}>
            <Card className="border-l-4" style={{ borderLeftColor: accent }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <span
                    aria-hidden="true"
                    className="size-3 shrink-0 rounded-full"
                    style={{ backgroundColor: accent }}
                  />
                  {workspace.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {workspace.projects.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin proyectos</p>
                ) : (
                  <ul className="space-y-1 text-sm">
                    {workspace.projects.map((project) => (
                      <li key={project.id}>
                        <button
                          type="button"
                          onClick={() => onOpenProject(project.id)}
                          className="w-full cursor-pointer rounded-md px-2 py-1 text-left outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
                        >
                          {project.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
