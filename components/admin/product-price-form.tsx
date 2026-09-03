"use client";

import { useRef, useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { updateProductPrice } from "@/app/actions/admin/catalog";
import { CurrencyInput } from "@/components/ui/currency-input";
import { cn } from "@/lib/utils";

/**
 * Preço do produto (vale para todas as geladeiras). Sem botão de salvar:
 * grava sozinho ao sair do campo (blur) ou pressionar Enter, só quando o
 * valor realmente mudou.
 */
export function ProductPriceForm({ productId, price }: { productId: string; price: number }) {
  const [pending, startTransition] = useTransition();
  const draftRef = useRef(price);

  function save() {
    const draft = draftRef.current;
    if (draft === price) return;
    startTransition(async () => {
      const result = await updateProductPrice(productId, draft);
      if (result.error) toast.error(result.error);
      else toast.success("Preço atualizado", { duration: 1500 });
    });
  }

  return (
    <div className="relative w-24">
      <CurrencyInput
        defaultValue={price}
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
