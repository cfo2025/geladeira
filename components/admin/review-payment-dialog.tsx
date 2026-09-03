"use client";

import { useActionState, useState } from "react";
import { reviewPayment, type ActionResult } from "@/app/actions/admin/payments";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/format";

const DECISIONS = [
  { value: "approved", label: "Aprovar (valor confere)" },
  { value: "rejected_divergent", label: "Rejeitar — divergência de valor" },
  { value: "rejected_unpaid", label: "Rejeitar — pagamento não identificado" },
];

export function ReviewPaymentDialog({
  paymentId,
  userName,
  expectedAmount,
  userDeclaredAmount,
}: {
  paymentId: string;
  userName: string;
  expectedAmount: number;
  userDeclaredAmount: number;
}) {
  const [open, setOpen] = useState(false);
  const [decision, setDecision] = useState("approved");
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(reviewPayment, {});

  useActionFeedback(state, {
    successMessage: "Pagamento revisado",
    onSuccess: () => setOpen(false),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" className="w-full" />}>Conferir</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Conferir pagamento de {userName}</DialogTitle>
          <DialogDescription>
            Esperado: {formatCurrency(expectedAmount)} · Declarado pelo usuário:{" "}
            {formatCurrency(userDeclaredAmount)}
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="paymentId" value={paymentId} />
          <input type="hidden" name="decision" value={decision} />
          <div className="space-y-2">
            <Label htmlFor="adminTypedAmount">Valor recebido (digite manualmente)</Label>
            <Input
              id="adminTypedAmount"
              name="adminTypedAmount"
              type="number"
              step="0.01"
              min="0"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Decisão</Label>
            <Select value={decision} onValueChange={(value) => setDecision(value ?? "approved")}>
              <SelectTrigger>
                <SelectValue>
                  {(value: string) => DECISIONS.find((d) => d.value === value)?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {DECISIONS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea id="notes" name="notes" maxLength={1000} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
