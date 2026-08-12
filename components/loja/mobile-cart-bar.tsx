"use client";

import { useState } from "react";
import { ShoppingBasket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useCart } from "@/components/loja/cart-context";
import { CartContents } from "@/components/loja/cart-contents";
import { formatCurrency } from "@/lib/format";

export function MobileCartBar() {
  const cart = useCart();
  const [open, setOpen] = useState(false);

  if (cart.totalItems === 0) return null;

  return (
    <>
      <div className="fixed inset-x-4 bottom-4 z-40 lg:hidden">
        <Button size="lg" className="w-full justify-between shadow-lg" onClick={() => setOpen(true)}>
          <span className="flex items-center gap-2">
            <ShoppingBasket className="h-4 w-4" />
            Ver Cesta &middot; {cart.totalItems} {cart.totalItems === 1 ? "item" : "itens"}
          </span>
          <span>{formatCurrency(cart.totalValue)}</span>
        </Button>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="flex max-h-[85vh] flex-col gap-3">
          <SheetTitle>Cesta de Retirada</SheetTitle>
          <div className="min-h-0 flex-1">
            <CartContents onCheckoutSuccess={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
