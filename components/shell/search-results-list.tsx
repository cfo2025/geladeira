import { cn } from "@/lib/utils";
import type { ProductSearchGroup } from "@/hooks/use-product-search";

export function SearchResultsList({
  results,
  className,
}: {
  results: ProductSearchGroup[];
  className?: string;
}) {
  if (results.length === 0) {
    return <p className="px-2 py-4 text-center text-sm text-muted-foreground">Item não encontrado.</p>;
  }

  return (
    <ul className={cn("space-y-1 overflow-y-auto", className)}>
      {results.map((group) => (
        <li key={group.name} className="rounded-md p-2 hover:bg-accent">
          <p className="text-sm font-medium">{group.name}</p>
          {group.category && <p className="text-xs text-muted-foreground">{group.category}</p>}
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {group.entries.map((entry, idx) => (
              <span
                key={idx}
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
                  entry.quantity > 0
                    ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {entry.locationName}: {entry.quantity} un.
              </span>
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}
