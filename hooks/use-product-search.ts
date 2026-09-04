"use client";

import { useMemo, useState } from "react";

type InventoryItem = {
  location_id: string;
  quantity: number;
  product: { name: string; category: string | null };
};

export type ProductSearchGroup = {
  name: string;
  category: string | null;
  entries: { locationName: string; quantity: number }[];
};

/** Agrupa o inventário por produto e filtra em tempo real por nome/categoria. */
export function useProductSearch(
  locations: { id: string; name: string }[],
  inventory: InventoryItem[]
) {
  const [query, setQuery] = useState("");

  const locationNameById = useMemo(
    () => new Map(locations.map((l) => [l.id, l.name])),
    [locations]
  );

  const productGroups = useMemo(() => {
    const map = new Map<string, ProductSearchGroup>();
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

  return { query, setQuery, results };
}
