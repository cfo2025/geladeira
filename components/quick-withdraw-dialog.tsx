"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WithdrawForm } from "@/components/withdraw-form";
import { formatCurrency } from "@/lib/format";

type InventoryItem = {
  id: string;
  location_id: string;
  price: number;
  quantity: number;
  product: { id: string; name: string };
};

export function QuickWithdrawDialog({
  locations,
  inventory,
}: {
  locations: { id: string; name: string }[];
  inventory: InventoryItem[];
}) {
  const [open, setOpen] = useState(false);
  const [locationId, setLocationId] = useState(locations[0]?.id ?? "");

  const items = inventory
    .filter((i) => i.location_id === locationId)
    .sort((a, b) => a.product.name.localeCompare(b.product.name));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="lg" className="gap-2" />}>
        <Plus className="h-4 w-4" />
        Novo lançamento
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo lançamento</DialogTitle>
          <DialogDescription>Escolha a geladeira e o item retirado.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Select value={locationId} onValueChange={(value) => setLocationId(value ?? locations[0]?.id ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue>
                {(value: string) => locations.find((loc) => loc.id === value)?.name}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {locations.map((loc) => (
                <SelectItem key={loc.id} value={loc.id}>
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {items.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhum produto disponível neste local.
              </p>
            )}
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(item.price)} &middot; {item.quantity} em estoque
                  </p>
                </div>
                <div className="w-40 shrink-0">
                  <WithdrawForm
                    productId={item.product.id}
                    locationId={locationId}
                    maxQuantity={item.quantity}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
