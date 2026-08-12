"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/loja/cart-context";

export function CartQuantityControl({
  productId,
  locationId,
  locationName,
  productName,
  category,
  price,
  maxQuantity,
}: {
  productId: string;
  locationId: string;
  locationName: string;
  productName: string;
  category: string | null;
  price: number;
  maxQuantity: number;
}) {
  const cart = useCart();
  const qty = cart.quantityFor(locationId, productId);

  if (maxQuantity <= 0) {
    return (
      <Button size="sm" disabled className="w-full">
        Sem estoque
      </Button>
    );
  }

  if (qty === 0) {
    return (
      <Button
        size="sm"
        className="w-full"
        onClick={() =>
          cart.addOne({ productId, locationId, locationName, productName, category, price, maxQuantity })
        }
      >
        Retirar (+1)
      </Button>
    );
  }

  const key = `${locationId}:${productId}`;

  return (
    <div className="flex items-center justify-between rounded-md border p-0.5">
      <Button
        size="icon-sm"
        variant="ghost"
        aria-label="Diminuir quantidade"
        onClick={() => cart.decrement(key)}
      >
        <Minus className="h-3.5 w-3.5" />
      </Button>
      <span className="text-sm font-semibold tabular-nums">{qty}</span>
      <Button
        size="icon-sm"
        variant="ghost"
        aria-label="Aumentar quantidade"
        disabled={qty >= maxQuantity}
        onClick={() => cart.increment(key)}
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
