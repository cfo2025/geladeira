import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export type KpiItem = {
  label: string;
  value: string;
  icon: LucideIcon;
};

export function KpiStrip({ items }: { items: KpiItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-0 sm:overflow-hidden sm:rounded-2xl sm:border">
      {items.map((item, idx) => (
        <div
          key={item.label}
          className={cn(
            "relative flex items-center gap-3 rounded-2xl border p-4 sm:rounded-none sm:border-y-0 sm:border-r sm:border-l-0 sm:last:border-r-0",
            idx === 0 && "bg-primary text-primary-foreground sm:border-primary"
          )}
        >
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
              idx === 0 ? "bg-primary-foreground/15" : "bg-accent"
            )}
          >
            <item.icon className={cn("h-5 w-5", idx === 0 ? "text-primary-foreground" : "text-gold")} />
          </div>
          <div className="min-w-0">
            <p
              className={cn(
                "text-[11px] font-semibold tracking-wider uppercase",
                idx === 0 ? "text-primary-foreground/70" : "text-muted-foreground"
              )}
            >
              {item.label}
            </p>
            <p className="truncate text-lg font-bold">{item.value}</p>
          </div>
          {idx < items.length - 1 && (
            <span className="absolute top-1/2 -right-[7px] z-10 hidden h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-background bg-gold sm:block" />
          )}
        </div>
      ))}
    </div>
  );
}
