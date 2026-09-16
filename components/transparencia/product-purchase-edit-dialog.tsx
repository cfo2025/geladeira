"use client";

import { useActionState, useState } from "react";
import { Pencil } from "lucide-react";
import { updateProductPurchase, type ActionResult } from "@/app/actions/transparencia";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type PurchaseRow = {
  id: string;
  quantity: number;
  unit_cost: number;
  observacoes: string | null;
};

export function ProductPurchaseEditDialog({ purchase }: { purchase: PurchaseRow }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(updateProductPurchase, {});

  useActionFeedback(state, {
    successMessage: "Compra atualizada",
    onSuccess: () => setOpen(false),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant="ghost" size="icon-sm" title="Editar compra" aria-label="Editar compra" />}
      >
        <Pencil className="h-3.5 w-3.5" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-4 w-4 text-gold" />
            Editar compra de produto
          </DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="id" value={purchase.id} />
          <div className="space-y-2">
            <Label htmlFor="purchaseQuantity">Quantidade</Label>
            <Input
              id="purchaseQuantity"
              name="quantity"
              type="number"
              min={1}
              step={1}
              defaultValue={purchase.quantity}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="purchaseUnitCost">Valor pago por unidade</Label>
            <CurrencyInput id="purchaseUnitCost" name="unitCost" defaultValue={purchase.unit_cost} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="purchaseObservacoes">Observações (opcional)</Label>
            <Textarea
              id="purchaseObservacoes"
              name="observacoes"
              rows={2}
              defaultValue={purchase.observacoes ?? ""}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : "Salvar alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
