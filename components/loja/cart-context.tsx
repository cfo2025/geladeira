"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type CartLine = {
  key: string;
  productId: string;
  locationId: string;
  locationName: string;
  productName: string;
  category: string | null;
  price: number;
  quantity: number;
  maxQuantity: number;
};

type NewCartLine = Omit<CartLine, "key" | "quantity">;

type CartContextValue = {
  lines: CartLine[];
  totalItems: number;
  totalValue: number;
  quantityFor: (locationId: string, productId: string) => number;
  addOne: (item: NewCartLine) => void;
  increment: (key: string) => void;
  decrement: (key: string) => void;
  remove: (key: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function makeKey(locationId: string, productId: string) {
  return `${locationId}:${productId}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  function addOne(item: NewCartLine) {
    if (item.maxQuantity <= 0) return;
    const key = makeKey(item.locationId, item.productId);
    setLines((prev) => {
      const existing = prev.find((l) => l.key === key);
      if (existing) {
        if (existing.quantity >= existing.maxQuantity) return prev;
        return prev.map((l) => (l.key === key ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [...prev, { ...item, key, quantity: 1 }];
    });
  }

  function increment(key: string) {
    setLines((prev) =>
      prev.map((l) => (l.key === key && l.quantity < l.maxQuantity ? { ...l, quantity: l.quantity + 1 } : l))
    );
  }

  function decrement(key: string) {
    setLines((prev) =>
      prev.map((l) => (l.key === key ? { ...l, quantity: l.quantity - 1 } : l)).filter((l) => l.quantity > 0)
    );
  }

  function remove(key: string) {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }

  function clear() {
    setLines([]);
  }

  function quantityFor(locationId: string, productId: string) {
    const key = makeKey(locationId, productId);
    return lines.find((l) => l.key === key)?.quantity ?? 0;
  }

  const totalItems = lines.reduce((sum, l) => sum + l.quantity, 0);
  const totalValue = lines.reduce((sum, l) => sum + l.quantity * l.price, 0);

  return (
    <CartContext.Provider
      value={{ lines, totalItems, totalValue, quantityFor, addOne, increment, decrement, remove, clear }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart deve ser usado dentro de um CartProvider");
  return ctx;
}
