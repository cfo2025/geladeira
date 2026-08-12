"use client";

import { ShoppingBasket } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useCart } from "@/components/loja/cart-context";
import { CartContents } from "@/components/loja/cart-contents";

export function SessionCartPanel() {
  const cart = useCart();

  return (
    <Card className="sticky top-28 hidden h-fit lg:block">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShoppingBasket className="h-4 w-4 text-gold" />
          Cesta de Retirada
          {cart.totalItems > 0 && (
            <span className="ml-auto text-xs font-normal text-muted-foreground">
              {cart.totalItems} {cart.totalItems === 1 ? "item" : "itens"}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex max-h-[26rem] flex-col">
        <CartContents />
      </CardContent>
    </Card>
  );
}
