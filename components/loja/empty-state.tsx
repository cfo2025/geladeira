import { PackageOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export function LojaEmptyState({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed text-center",
        compact ? "py-8" : "gap-3 py-16"
      )}
    >
      <span
        className={cn(
          "flex items-center justify-center rounded-full bg-muted",
          compact ? "h-10 w-10" : "h-14 w-14"
        )}
      >
        <PackageOpen className={cn("text-muted-foreground", compact ? "h-5 w-5" : "h-6 w-6")} />
      </span>
      <p className={cn("text-muted-foreground", compact ? "text-xs" : "text-sm")}>
        Nenhum produto disponível neste local no momento.
      </p>
    </div>
  );
}
