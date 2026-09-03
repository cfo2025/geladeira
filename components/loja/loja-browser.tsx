"use client";

import { useState } from "react";
import { LocationCard } from "@/components/loja/location-card";
import { ProductCard } from "@/components/loja/product-card";
import { LojaEmptyState } from "@/components/loja/empty-state";
import { CartProvider } from "@/components/loja/cart-context";
import { SessionCartPanel } from "@/components/loja/session-cart-panel";
import { MobileCartBar } from "@/components/loja/mobile-cart-bar";

type InventoryItem = {
  id: string;
  location_id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    category: string | null;
    image_url: string | null;
    price: number;
    promo_price: number | null;
  };
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

  const selectedLocation = locations.find((l) => l.id === selectedId);
  const items = inventory
    .filter((i) => i.location_id === selectedId)
    .sort((a, b) => a.product.name.localeCompare(b.product.name));

  return (
    <CartProvider>
      <div className="flex flex-col gap-6 pb-20 md:flex-row md:items-start md:pb-0">
        <div className="min-w-0 flex-1 space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {items.map((item) => (
                <ProductCard
                  key={item.id}
                  productId={item.product.id}
                  locationId={selectedId}
                  locationName={selectedLocation?.name ?? ""}
                  name={item.product.name}
                  category={item.product.category}
                  imageUrl={item.product.image_url}
                  price={item.product.price}
                  promoPrice={item.product.promo_price}
                  quantity={item.quantity}
                />
              ))}
            </div>
          )}
        </div>

        <div className="w-full shrink-0 md:w-80 lg:w-96">
          <SessionCartPanel />
        </div>
      </div>
      <MobileCartBar />
    </CartProvider>
  );
}
