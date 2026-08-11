"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { declarePayment, type ActionResult } from "@/app/actions/payments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export function DeclarePaymentForm({ balance }: { balance: number }) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(declarePayment, {});
  const [amount, setAmount] = useState(balance.toFixed(2));

  useEffect(() => {
    if (state.success) {
      toast.success("Pagamento declarado. Aguarde a conferência.");
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="amount">Valor que você pagou</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="isPartial"
          name="isPartial"
          defaultChecked={Number(amount) < balance}
        />
        <Label htmlFor="isPartial" className="font-normal">
          Este é um pagamento parcial
        </Label>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Enviando..." : "Declarar pagamento"}
      </Button>
    </form>
  );
}
