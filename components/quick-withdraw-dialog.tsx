"use client";

import { useMemo, useState } from "react";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LocationCard } from "@/components/loja/location-card";
import { ProductCard } from "@/components/loja/product-card";
import { LojaEmptyState } from "@/components/loja/empty-state";
import { CartProvider } from "@/components/loja/cart-context";
import { CartContents } from "@/components/loja/cart-contents";

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

const PAGE_SIZE = 6;

export function QuickWithdrawDialog({
  locations,
  inventory,
  size = "lg",
  className,
}: {
  locations: { id: string; name: string }[];
  inventory: InventoryItem[];
  size?: "default" | "sm" | "lg";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [locationId, setLocationId] = useState(locations[0]?.id ?? "");
  const [page, setPage] = useState(0);

  const totalsByLocation = new Map<string, number>();
  for (const item of inventory) {
    totalsByLocation.set(item.location_id, (totalsByLocation.get(item.location_id) ?? 0) + item.quantity);
  }

  const selectedLocation = locations.find((l) => l.id === locationId);
  const items = useMemo(
    () =>
      inventory
        .filter((i) => i.location_id === locationId)
        .sort((a, b) => a.product.name.localeCompare(b.product.name)),
    [inventory, locationId]
  );

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const pageItems = items.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  function handleSelectLocation(id: string) {
    setLocationId(id);
    setPage(0);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size={size} className={cn("gap-1.5", className)} />}>
        <Plus className="h-4 w-4" />
        Novo Lançamento
      </DialogTrigger>
      <DialogContent className="flex max-h-[88vh] flex-col gap-3 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Novo lançamento</DialogTitle>
          <DialogDescription>Escolha a geladeira e o que você retirou.</DialogDescription>
        </DialogHeader>

        <CartProvider>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            <div className="grid grid-cols-3 gap-2">
              {locations.map((loc) => (
                <LocationCard
                  key={loc.id}
                  name={loc.name}
                  totalItems={totalsByLocation.get(loc.id) ?? 0}
                  active={loc.id === locationId}
                  onSelect={() => handleSelectLocation(loc.id)}
                  compact
                />
              ))}
            </div>

            {items.length === 0 ? (
              <LojaEmptyState compact />
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {pageItems.map((item) => (
                    <ProductCard
                      key={item.id}
                      productId={item.product.id}
                      locationId={locationId}
                      locationName={selectedLocation?.name ?? ""}
                      name={item.product.name}
                      category={item.product.category}
                      imageUrl={item.product.image_url}
                      price={item.product.price}
                      promoPrice={item.product.promo_price}
                      quantity={item.quantity}
                      compact
                    />
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 pt-1">
                    <Button
                      variant="outline"
                      size="icon-xs"
                      disabled={page === 0}
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      aria-label="Página anterior"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      Página {page + 1} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon-xs"
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      aria-label="Próxima página"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex max-h-52 shrink-0 flex-col border-t pt-2">
            <CartContents onCheckoutSuccess={() => setOpen(false)} compact />
          </div>
        </CartProvider>
      </DialogContent>
    </Dialog>
  );
}
