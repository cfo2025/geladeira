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
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border font-heading text-[11px] font-semibold tracking-wide",
          "border-gold/40 bg-gold/10 text-gold"
        )}
      >
        XVII
      </span>
      {!compact && (
        <span className="flex flex-col leading-tight">
          <span
            className={cn(
              "font-heading text-[15px] font-semibold tracking-wide",
              tone === "dark" ? "text-sidebar-foreground" : "text-foreground"
            )}
          >
            CFO Tucum XVII
          </span>
          <span
            className={cn(
              "text-[11px] tracking-wide uppercase",
              tone === "dark" ? "text-sidebar-foreground/60" : "text-muted-foreground"
            )}
          >
            Loja Honesta
          </span>
        </span>
      )}
    </div>
  );
}
