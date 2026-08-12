import { PackageOpen } from "lucide-react";

export function LojaEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <PackageOpen className="h-6 w-6 text-muted-foreground" />
      </span>
      <p className="text-sm text-muted-foreground">
        Nenhum produto disponível neste local no momento.
      </p>
    </div>
  );
}
