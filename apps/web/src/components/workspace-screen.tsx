import { Button } from "@/components/ui/button.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { useWorkspaces } from "@/hooks/use-workspaces.ts";
import { queryClient } from "@/lib/query-client.ts";
import { signOut } from "@/lib/auth-client.ts";

type WorkspaceScreenProps = {
  name: string;
  email: string;
};

export function WorkspaceScreen({ name, email }: WorkspaceScreenProps) {
  const workspaces = useWorkspaces(true);
  const workspace = workspaces.data?.workspaces[0];

  async function onSignOut() {
    await signOut();
    queryClient.removeQueries({ queryKey: ["workspaces"] });
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Agentic Kanban</CardTitle>
          <CardDescription>Signed in workspace</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <InfoRow label="Signed in as" value={`${name}`} detail={email} />
          {workspaces.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : workspaces.isError ? (
            <p className="text-sm text-destructive">
              Could not load workspace data. Try signing in again.
            </p>
          ) : workspace ? (
            <>
              <InfoRow label="Workspace" value={workspace.name} />
              <InfoRow label="Project" value={workspace.project?.name ?? "No project yet"} />
            </>
          ) : (
            <p className="rounded-lg border px-3 py-3 text-sm text-muted-foreground">
              You are not a member of any workspace yet.
            </p>
          )}
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full" type="button" onClick={onSignOut}>
            Sign out
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}

function InfoRow({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-lg border px-3 py-2">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
      {detail ? <p className="text-sm text-muted-foreground">{detail}</p> : null}
    </div>
  );
}
