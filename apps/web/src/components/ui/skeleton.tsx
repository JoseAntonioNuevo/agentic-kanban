/** Placeholder animado mientras TanStack Query carga el health. */
import { cn } from "@/lib/utils";

/** Barra gris con pulse; tres de estas cubren las filas de health. */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export { Skeleton };
