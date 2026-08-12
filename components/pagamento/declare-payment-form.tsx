"use client";

import { useActionState, useState } from "react";
import { declarePayment, type ActionResult } from "@/app/actions/payments";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";

export function DeclarePaymentForm({ balance }: { balance: number }) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(declarePayment, {});
  const [isPartial, setIsPartial] = useState(false);
  const [amount, setAmount] = useState(balance.toFixed(2));

  useActionFeedback(state, {
    successMessage:
      "Pagamento declarado com sucesso! O valor ficará em análise até a confirmação da administração.",
  });

  return (
    <Card>
      <CardContent className="space-y-6 pt-6">
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            Saldo Total em Aberto
          </p>
          <p className="mt-1 text-3xl font-bold tabular-nums">{formatCurrency(balance)}</p>
        </div>

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Valor que você pagou (R$)</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              readOnly={!isPartial}
              className={cn(!isPartial && "cursor-not-allowed bg-muted")}
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="isPartial"
              name="isPartial"
              checked={isPartial}
              onCheckedChange={(checked) => {
                const value = Boolean(checked);
                setIsPartial(value);
                if (!value) setAmount(balance.toFixed(2));
              }}
            />
            <Label htmlFor="isPartial" className="font-normal">
              Este é um pagamento parcial
            </Label>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={pending}>
            {pending ? "Enviando..." : "Declarar Pagamento"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
