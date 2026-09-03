"use client";

import { useActionState, useState, useTransition } from "react";
import { toast } from "sonner";
import { BadgePercent } from "lucide-react";
import { setPromoPrice, clearPromoPrice, type ActionResult } from "@/app/actions/admin/catalog";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import { formatCurrency } from "@/lib/format";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function PromoDialog({
  locationId,
  productId,
  productName,
  locationName,
  price,
  promoPrice,
  disabled = false,
}: {
  locationId: string;
  productId: string;
  productName: string;
  locationName: string;
  price: number;
  promoPrice: number | null;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [draftPromo, setDraftPromo] = useState(promoPrice ?? 0);
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(setPromoPrice, {});
  const [clearPending, startClearTransition] = useTransition();

  useActionFeedback(state, {
    successMessage: "Promoção salva",
    onSuccess: () => setOpen(false),
  });

  function handleClear() {
    startClearTransition(async () => {
      const result = await clearPromoPrice(locationId, productId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Promoção removida");
        setOpen(false);
      }
    });
  }

  const discountPercent = draftPromo > 0 && draftPromo < price ? Math.round((1 - draftPromo / price) * 100) : 0;
  const isActive = promoPrice != null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setDraftPromo(promoPrice ?? 0);
      }}
    >
      <DialogTrigger
        render={
          <Button
            size="icon-sm"
            variant={isActive ? "default" : "outline"}
            disabled={disabled}
            title={disabled ? "Defina um preço para este produto antes de criar uma promoção" : isActive ? "Editar promoção" : "Criar promoção"}
            aria-label="Promoção"
          />
        }
      >
        <BadgePercent className="h-3.5 w-3.5" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BadgePercent className="h-4 w-4 text-gold" />
            {isActive ? "Editar promoção" : "Criar promoção"}
          </DialogTitle>
          <DialogDescription>
            {productName} &middot; {locationName}
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="locationId" value={locationId} />
          <input type="hidden" name="productId" value={productId} />

          <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2">
            <span className="text-sm text-muted-foreground">Preço atual</span>
            <span className="text-sm font-semibold tabular-nums">{formatCurrency(price)}</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="promoPrice">Preço promocional</Label>
            <CurrencyInput
              key={String(open)}
              id="promoPrice"
              name="promoPrice"
              defaultValue={promoPrice ?? 0}
              onValueChange={setDraftPromo}
              required
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-dashed px-3 py-2">
            <span className="text-sm text-muted-foreground">Desconto</span>
            <span className="text-sm font-semibold tabular-nums text-green-600 dark:text-green-400">
              {discountPercent > 0 ? `−${discountPercent}%` : "—"}
            </span>
          </div>

          <DialogFooter>
            {isActive && (
              <Button type="button" variant="outline" disabled={clearPending || pending} onClick={handleClear}>
                {clearPending ? "Removendo..." : "Remover promoção"}
              </Button>
            )}
            <Button type="submit" disabled={pending || clearPending}>
              {pending ? "Salvando..." : "Salvar promoção"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
