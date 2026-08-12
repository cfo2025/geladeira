import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandMark({
  className,
  compact = false,
  tone = "dark",
}: {
  className?: string;
  compact?: boolean;
  tone?: "dark" | "light";
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gold/40 bg-gold/10">
        <ShieldCheck className="h-4.5 w-4.5 text-gold" strokeWidth={2.25} />
      </span>
      {!compact && (
        <span className="flex flex-col leading-tight">
          <span
            className={cn(
              "text-[15px] font-bold tracking-tight",
              tone === "dark" ? "text-sidebar-foreground" : "text-foreground"
            )}
          >
            CFO Tucum XVII
          </span>
          <span className="text-[10px] font-semibold tracking-widest text-gold uppercase">
            Loja Honesta
          </span>
        </span>
      )}
    </div>
  );
}
