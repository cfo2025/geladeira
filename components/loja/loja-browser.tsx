"use client";

import { useState } from "react";
import { LocationCard } from "@/components/loja/location-card";
import { ProductCard } from "@/components/loja/product-card";
import { LojaEmptyState } from "@/components/loja/empty-state";

type InventoryItem = {
  id: string;
  location_id: string;
  price: number;
  quantity: number;
  product: { id: string; name: string; category: string | null; image_url: string | null };
};

export function LojaBrowser({
  locations,
  inventory,
}: {
  locations: { id: string; name: string }[];
  inventory: InventoryItem[];
}) {
  const [selectedId, setSelectedId] = useState(locations[0]?.id ?? "");

  const totalsByLocation = new Map<string, number>();
  for (const item of inventory) {
    totalsByLocation.set(item.location_id, (totalsByLocation.get(item.location_id) ?? 0) + item.quantity);
  }

  const items = inventory
    .filter((i) => i.location_id === selectedId)
    .sort((a, b) => a.product.name.localeCompare(b.product.name));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {locations.map((loc) => (
          <LocationCard
            key={loc.id}
            name={loc.name}
            totalItems={totalsByLocation.get(loc.id) ?? 0}
            active={loc.id === selectedId}
            onSelect={() => setSelectedId(loc.id)}
          />
        ))}
      </div>

      {items.length === 0 ? (
        <LojaEmptyState />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <ProductCard
              key={item.id}
              productId={item.product.id}
              locationId={selectedId}
              name={item.product.name}
              category={item.product.category}
              imageUrl={item.product.image_url}
              price={item.price}
              quantity={item.quantity}
            />
          ))}
        </div>
      )}
    </div>
  );
}
