"use client";

import { useActionState } from "react";
import { createWithdrawal, type ActionResult } from "@/app/actions/withdrawals";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import { Button } from "@/components/ui/button";

export function WithdrawForm({
  productId,
  locationId,
  maxQuantity,
  className,
}: {
  productId: string;
  locationId: string;
  maxQuantity: number;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(createWithdrawal, {});

  useActionFeedback(state, { successMessage: "Retirada registrada" });

  if (maxQuantity <= 0) {
    return (
      <Button size="sm" disabled className={className}>
        Sem estoque
      </Button>
    );
  }

  return (
    <form action={formAction} className={className}>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="locationId" value={locationId} />
      <input type="hidden" name="quantity" value={1} />
      <Button type="submit" size="sm" disabled={pending} className="w-full">
        {pending ? "Retirando..." : "Retirar (+1)"}
      </Button>
    </form>
  );
}
