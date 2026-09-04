"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { useProductSearch } from "@/hooks/use-product-search";
import { SearchResultsList } from "@/components/shell/search-results-list";

type InventoryItem = {
  location_id: string;
  quantity: number;
  product: { name: string; category: string | null };
};

export function GlobalSearch({
  locations,
  inventory,
}: {
  locations: { id: string; name: string }[];
  inventory: InventoryItem[];
}) {
  const { query, setQuery, results } = useProductSearch(locations, inventory);
  const [focused, setFocused] = useState(false);

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
          <SearchResultsList results={results} className="max-h-80" />
        </div>
      )}
    </div>
  );
}
