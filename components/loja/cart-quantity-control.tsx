"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCart } from "@/components/loja/cart-context";

export function CartQuantityControl({
  productId,
  locationId,
  locationName,
  productName,
  category,
  price,
  maxQuantity,
  compact = false,
}: {
  productId: string;
  locationId: string;
  locationName: string;
  productName: string;
  category: string | null;
  price: number;
  maxQuantity: number;
  compact?: boolean;
}) {
  const cart = useCart();
  const qty = cart.quantityFor(locationId, productId);

  if (maxQuantity <= 0) {
    return (
      <Button size={compact ? "xs" : "sm"} disabled className="w-full">
        Sem estoque
      </Button>
    );
  }

  if (qty === 0) {
    return (
      <Button
        size={compact ? "xs" : "sm"}
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
        size={compact ? "icon-xs" : "icon-sm"}
        variant="ghost"
        aria-label="Diminuir quantidade"
        onClick={() => cart.decrement(key)}
      >
        <Minus className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
      </Button>
      <span className={cn("font-semibold tabular-nums", compact ? "text-xs" : "text-sm")}>{qty}</span>
      <Button
        size={compact ? "icon-xs" : "icon-sm"}
        variant="ghost"
        aria-label="Aumentar quantidade"
        disabled={qty >= maxQuantity}
        onClick={() => cart.increment(key)}
      >
        <Plus className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
      </Button>
    </div>
  );
}
