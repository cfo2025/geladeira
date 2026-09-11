"use client";

import { useRef, useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { updateProductCost } from "@/app/actions/admin/catalog";
import { CurrencyInput } from "@/components/ui/currency-input";
import { cn } from "@/lib/utils";

/**
 * Custo unitário do produto (usado só pra projetar o lucro bruto em
 * /transparencia — não afeta preço de venda nem estoque). Mesmo padrão do
 * ProductPriceForm: grava sozinho ao sair do campo, sem botão de salvar.
 */
export function ProductCostForm({ productId, costPrice }: { productId: string; costPrice: number }) {
  const [pending, startTransition] = useTransition();
  const draftRef = useRef(costPrice);

  function save() {
    const draft = draftRef.current;
    if (draft === costPrice) return;
    startTransition(async () => {
      const result = await updateProductCost(productId, draft);
      if (result.error) toast.error(result.error);
      else toast.success("Custo atualizado", { duration: 1500 });
    });
  }

  return (
    <div className="relative w-24">
      <CurrencyInput
        defaultValue={costPrice}
        onValueChange={(value) => {
          draftRef.current = value;
        }}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        disabled={pending}
        className={cn(pending && "pr-7")}
      />
      {pending && (
        <Loader2 className="pointer-events-none absolute top-1/2 right-2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
      )}
    </div>
  );
}
