"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { ShoppingCart, TriangleAlert } from "lucide-react";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

type Product = {
  id: string;
  name: string;
  category: string | null;
  image_url: string | null;
  price: number;
  promo_price: number | null;
};

export function ProductPurchaseForm({ products }: { products: Product[] }) {
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitCost, setUnitCost] = useState(0);
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(registerProductPurchase, {});
  const formRef = useRef<HTMLFormElement>(null);

  useActionFeedback(state, {
    successMessage: "Compra registrada — estoque reposto e custo médio atualizado",
    onSuccess: () => {
      formRef.current?.reset();
      setProductId("");
      setQuantity(1);
      setUnitCost(0);
      setOpen(false);
    },
  });

  const selectedProduct = products.find((p) => p.id === productId) ?? null;
  const salePrice = selectedProduct ? (selectedProduct.promo_price ?? selectedProduct.price) : null;
  const projectedProfit = useMemo(() => {
    if (salePrice == null) return null;
    return (salePrice - unitCost) * (quantity || 0);
  }, [salePrice, unitCost, quantity]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setProductId("");
          setQuantity(1);
          setUnitCost(0);
        }
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
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-4">
          <input type="hidden" name="productId" value={productId} />
          <div className="space-y-2">
            <Label htmlFor="productSearch">Produto</Label>
            <ProductPicker products={products} value={productId} onChange={setProductId} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantidade comprada</Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              min="1"
              step="1"
              defaultValue={1}
              onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 0)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unitCost">Valor pago por unidade</Label>
            <CurrencyInput id="unitCost" name="unitCost" onValueChange={setUnitCost} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações (opcional)</Label>
            <Textarea id="observacoes" name="observacoes" rows={2} />
          </div>

          {selectedProduct && (
            <div
              className={cn(
                "flex items-center justify-between rounded-lg border px-3 py-2 text-sm",
                projectedProfit != null && projectedProfit < 0
                  ? "border-destructive/30 bg-destructive/5 text-destructive"
                  : "bg-muted/40"
              )}
            >
              <span className="flex items-center gap-1.5">
                {projectedProfit != null && projectedProfit < 0 && (
                  <TriangleAlert className="h-3.5 w-3.5 shrink-0" />
                )}
                Lucro previsto nesta compra
              </span>
              <span className="font-semibold tabular-nums">
                {projectedProfit != null ? formatCurrency(projectedProfit) : "—"}
              </span>
            </div>
          )}

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
