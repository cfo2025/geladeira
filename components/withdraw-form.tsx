"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { createWithdrawal, type ActionResult } from "@/app/actions/withdrawals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function WithdrawForm({
  productId,
  locationId,
  maxQuantity,
}: {
  productId: string;
  locationId: string;
  maxQuantity: number;
}) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(createWithdrawal, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      toast.success("Retirada registrada");
      formRef.current?.reset();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  if (maxQuantity <= 0) {
    return (
      <Button size="sm" disabled className="w-full">
        Sem estoque
      </Button>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="locationId" value={locationId} />
      <Input
        type="number"
        name="quantity"
        defaultValue={1}
        min={1}
        max={maxQuantity}
        className="w-16"
      />
      <Button type="submit" size="sm" disabled={pending} className="flex-1">
        {pending ? "Retirando..." : "Retirar"}
      </Button>
    </form>
  );
}
