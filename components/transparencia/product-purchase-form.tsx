"use client";

import { useActionState, useRef, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { registerProductPurchase, type ActionResult } from "@/app/actions/transparencia";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CurrencyInput } from "@/components/ui/currency-input";
import { ProductPicker } from "@/components/transparencia/product-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Product = { id: string; name: string; category: string | null; image_url: string | null };

export function ProductPurchaseForm({ products }: { products: Product[] }) {
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState("");
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(registerProductPurchase, {});
  const formRef = useRef<HTMLFormElement>(null);

  useActionFeedback(state, {
    successMessage: "Compra registrada — estoque reposto e custo médio atualizado",
    onSuccess: () => {
      formRef.current?.reset();
      setProductId("");
      setOpen(false);
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setProductId("");
      }}
    >
      <DialogTrigger render={<Button variant="outline" />}>
        <ShoppingCart className="h-4 w-4" />
        Lançar compra de produto
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-gold" />
            Lançar compra de produto
          </DialogTitle>
          <DialogDescription>
            Já soma a quantidade comprada no estoque do local ativo e recalcula o custo médio do
            produto (pro lucro previsto/real). Não desconta do saldo em caixa — se o dinheiro
            realmente saiu do caixa pra pagar, lance também em &quot;Lançar despesa&quot;.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-4">
          <input type="hidden" name="productId" value={productId} />
          <div className="space-y-2">
            <Label htmlFor="productSearch">Produto</Label>
            <ProductPicker products={products} value={productId} onChange={setProductId} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantidade comprada</Label>
            <Input id="quantity" name="quantity" type="number" min="1" step="1" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unitCost">Valor pago por unidade</Label>
            <CurrencyInput id="unitCost" name="unitCost" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações (opcional)</Label>
            <Textarea id="observacoes" name="observacoes" rows={2} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending || !productId}>
              {pending ? "Registrando..." : "Registrar compra"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
