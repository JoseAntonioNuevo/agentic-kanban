import { Badge } from "@/components/ui/badge.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { useHealth } from "@/hooks/use-health.ts";

export default function App() {
  const health = useHealth();

  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-6">
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
    </main>
  );
}

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
