"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Minus, Plus, X, ShoppingBasket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCart } from "@/components/loja/cart-context";
import { checkoutCart } from "@/app/actions/withdrawals";
import { formatCurrency } from "@/lib/format";

export function CartContents({
  onCheckoutSuccess,
  compact = false,
}: {
  onCheckoutSuccess?: () => void;
  compact?: boolean;
}) {
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
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-1.5 text-center",
          compact ? "py-3" : "py-10"
        )}
      >
        <ShoppingBasket className={cn("text-muted-foreground/40", compact ? "h-5 w-5" : "h-8 w-8")} />
        <p className={cn("text-muted-foreground", compact ? "text-xs" : "text-sm")}>Sua cesta está vazia.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className={cn("flex-1 overflow-y-auto pr-1", compact ? "space-y-2" : "space-y-3")}>
        {cart.lines.map((line) => (
          <div
            key={line.key}
            className={cn(
              "flex items-start justify-between gap-2 border-b last:border-0",
              compact ? "pb-2" : "pb-3"
            )}
          >
            <div className="min-w-0">
              <p className={cn("truncate font-medium", compact ? "text-xs" : "text-sm")}>{line.productName}</p>
              {!compact && (
                <p className="truncate text-xs text-muted-foreground">
                  {line.category || line.locationName}
                </p>
              )}
              <div className={cn("flex items-center gap-1.5", compact ? "mt-1" : "mt-1.5")}>
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
      <div className={cn("space-y-2 border-t", compact ? "mt-2 pt-2" : "mt-3 space-y-3 pt-3")}>
        <div className="flex items-center justify-between font-semibold">
          <span className="text-sm">Total</span>
          <span className={compact ? "text-base" : "text-lg"}>{formatCurrency(cart.totalValue)}</span>
        </div>
        <Button className="w-full" size={compact ? "default" : "lg"} disabled={pending} onClick={handleCheckout}>
          {pending ? "Finalizando..." : "Finalizar Retirada"}
        </Button>
      </div>
    </div>
  );
}
