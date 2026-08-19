import { AuthScreen } from "@/components/auth-screen.tsx";
import { WorkspaceScreen } from "@/components/workspace-screen.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { useSession } from "@/lib/auth-client.ts";

export default function App() {
  const session = useSession();

  if (session.isPending) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-background p-6">
        <div className="w-full max-w-md space-y-3">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-40 w-full" />
        </div>
      </main>
    );
  }

  if (!session.data) {
    return <AuthScreen />;
  }

  return <WorkspaceScreen name={session.data.user.name} email={session.data.user.email} />;
}
