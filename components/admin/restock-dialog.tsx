"use client";

import { useActionState, useState } from "react";
import { Plus, PackagePlus } from "lucide-react";
import { restockInventory, type ActionResult } from "@/app/actions/admin/catalog";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function RestockDialog({
  locationId,
  locationName,
  productId,
  productName,
  currentQuantity,
  disabled = false,
}: {
  locationId: string;
  locationName: string;
  productId: string;
  productName: string;
  currentQuantity: number;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(restockInventory, {});

  useActionFeedback(state, {
    successMessage: "Estoque reposto",
    onSuccess: () => setOpen(false),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            size="icon-sm"
            variant="outline"
            disabled={disabled}
            title={disabled ? "Defina um preço para este produto antes de repor estoque" : "Repor estoque"}
            aria-label="Repor estoque"
          />
        }
      >
        <Plus className="h-3.5 w-3.5" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackagePlus className="h-4 w-4 text-gold" />
            Repor estoque
          </DialogTitle>
          <DialogDescription>
            {productName} &middot; {locationName} &middot; estoque atual: {currentQuantity} un.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="locationId" value={locationId} />
          <input type="hidden" name="productId" value={productId} />
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantidade a adicionar</Label>
            <Input id="quantity" name="quantity" type="number" min="1" step="1" autoFocus required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Observação (opcional)</Label>
            <Input id="notes" name="notes" placeholder="Ex: compra do mês" />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : "Confirmar reposição"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
