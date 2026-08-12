"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Minus, Plus, X, ShoppingBasket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/loja/cart-context";
import { checkoutCart } from "@/app/actions/withdrawals";
import { formatCurrency } from "@/lib/format";

export function CartContents({ onCheckoutSuccess }: { onCheckoutSuccess?: () => void }) {
  const cart = useCart();
  const [pending, startTransition] = useTransition();

  function handleCheckout() {
    const items = cart.lines.map((l) => ({
      productId: l.productId,
      locationId: l.locationId,
      quantity: l.quantity,
    }));
    const total = cart.totalValue;

    startTransition(async () => {
      const result = await checkoutCart(items);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Retirada registrada: ${formatCurrency(total)} adicionados ao seu saldo.`);
        cart.clear();
        onCheckoutSuccess?.();
      }
    });
  }

  if (cart.lines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
        <ShoppingBasket className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Sua cesta está vazia.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {cart.lines.map((line) => (
          <div key={line.key} className="flex items-start justify-between gap-2 border-b pb-3 last:border-0">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{line.productName}</p>
              <p className="truncate text-xs text-muted-foreground">
                {line.category || line.locationName}
              </p>
              <div className="mt-1.5 flex items-center gap-1.5">
                <Button
                  size="icon-xs"
                  variant="ghost"
                  aria-label="Diminuir quantidade"
                  onClick={() => cart.decrement(line.key)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-5 text-center text-xs font-semibold tabular-nums">{line.quantity}</span>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  aria-label="Aumentar quantidade"
                  disabled={line.quantity >= line.maxQuantity}
                  onClick={() => cart.increment(line.key)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
                <button
                  type="button"
                  aria-label="Remover item"
                  onClick={() => cart.remove(line.key)}
                  className="ml-1 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <span className="shrink-0 text-sm font-semibold tabular-nums">
              {formatCurrency(line.price * line.quantity)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 space-y-3 border-t pt-3">
        <div className="flex items-center justify-between font-semibold">
          <span className="text-sm">Total</span>
          <span className="text-lg">{formatCurrency(cart.totalValue)}</span>
        </div>
        <Button className="w-full" size="lg" disabled={pending} onClick={handleCheckout}>
          {pending ? "Finalizando..." : "Finalizar Retirada"}
        </Button>
      </div>
    </div>
  );
}
