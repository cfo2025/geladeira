"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

type InventoryItem = {
  location_id: string;
  quantity: number;
  product: { name: string; category: string | null };
};

type ProductGroup = {
  name: string;
  category: string | null;
  entries: { locationName: string; quantity: number }[];
};

export function GlobalSearch({
  locations,
  inventory,
}: {
  locations: { id: string; name: string }[];
  inventory: InventoryItem[];
}) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const locationNameById = useMemo(
    () => new Map(locations.map((l) => [l.id, l.name])),
    [locations]
  );

  const productGroups = useMemo(() => {
    const map = new Map<string, ProductGroup>();
    for (const item of inventory) {
      const key = item.product.name.toLowerCase();
      const entry = {
        locationName: locationNameById.get(item.location_id) ?? "—",
        quantity: item.quantity,
      };
      const existing = map.get(key);
      if (existing) {
        existing.entries.push(entry);
      } else {
        map.set(key, { name: item.product.name, category: item.product.category, entries: [entry] });
      }
    }
    return [...map.values()];
  }, [inventory, locationNameById]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return productGroups.filter(
      (g) => g.name.toLowerCase().includes(q) || g.category?.toLowerCase().includes(q)
    );
  }, [productGroups, query]);

  const showDropdown = focused && query.trim().length > 0;

  return (
    <div className="relative hidden w-full max-w-sm sm:block">
      <Search className="pointer-events-none absolute top-1/2 left-3 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        placeholder="Buscar item..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        className="h-9 w-full rounded-full border border-input bg-muted/40 pr-3 pl-9 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      {showDropdown && (
        <div className="absolute top-full left-0 z-50 mt-2 w-full min-w-80 rounded-lg border bg-popover p-2 text-popover-foreground shadow-md ring-1 ring-foreground/10">
          {results.length === 0 ? (
            <p className="px-2 py-4 text-center text-sm text-muted-foreground">
              Item não encontrado.
            </p>
          ) : (
            <ul className="max-h-80 space-y-1 overflow-y-auto">
              {results.map((group) => (
                <li key={group.name} className="rounded-md p-2 hover:bg-accent">
                  <p className="text-sm font-medium">{group.name}</p>
                  {group.category && (
                    <p className="text-xs text-muted-foreground">{group.category}</p>
                  )}
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
          )}
        </div>
      )}
    </div>
  );
}
