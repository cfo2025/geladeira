"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { updateInventoryPrice, type ActionResult } from "@/app/actions/admin/catalog";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";

export function InventoryPriceForm({
  locationId,
  productId,
  price,
}: {
  locationId: string;
  productId: string;
  price: number | null;
}) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(updateInventoryPrice, {});

  useEffect(() => {
    if (state.success) {
      toast.success("Preço atualizado");
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form action={formAction} className="flex items-center gap-1.5">
      <input type="hidden" name="locationId" value={locationId} />
      <input type="hidden" name="productId" value={productId} />
      <CurrencyInput name="price" defaultValue={price ?? 0} className="w-24" required />
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "..." : "Salvar"}
      </Button>
    </form>
  );
}
