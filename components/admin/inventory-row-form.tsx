"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { upsertInventory, type ActionResult } from "@/app/actions/admin/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function InventoryRowForm({
  locationId,
  productId,
  price,
  quantity,
}: {
  locationId: string;
  productId: string;
  price: number | null;
  quantity: number | null;
}) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(upsertInventory, {});

  useEffect(() => {
    if (state.success) {
      toast.success("Estoque atualizado");
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="locationId" value={locationId} />
      <input type="hidden" name="productId" value={productId} />
      <Input
        type="number"
        name="price"
        step="0.01"
        min="0"
        defaultValue={price ?? ""}
        placeholder="Preço"
        className="w-24"
        required
      />
      <Input
        type="number"
        name="quantity"
        min="0"
        defaultValue={quantity ?? 0}
        placeholder="Qtd."
        className="w-20"
        required
      />
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "..." : "Salvar"}
      </Button>
    </form>
  );
}
