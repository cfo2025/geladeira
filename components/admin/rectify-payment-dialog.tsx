"use client";

import { useActionState, useState } from "react";
import { Pencil } from "lucide-react";
import { rectifyPayment, type ActionResult } from "@/app/actions/admin/payments";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/format";

export function RectifyPaymentDialog({
  paymentId,
  userName,
  currentAmount,
}: {
  paymentId: string;
  userName: string;
  currentAmount: number | null;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(rectifyPayment, {});

  useActionFeedback(state, {
    successMessage: "Pagamento retificado",
    onSuccess: () => setOpen(false),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant="ghost" size="icon-sm" title="Retificar valor" aria-label="Retificar valor" />}
      >
        <Pencil className="h-3.5 w-3.5" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-4 w-4 text-gold" />
            Retificar pagamento de {userName}
          </DialogTitle>
          <DialogDescription>
            Valor conferido atualmente: {currentAmount !== null ? formatCurrency(currentAmount) : "—"}
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="paymentId" value={paymentId} />
          <div className="space-y-2">
            <Label htmlFor="adminTypedAmount">Novo valor conferido</Label>
            <CurrencyInput
              id="adminTypedAmount"
              name="adminTypedAmount"
              defaultValue={currentAmount ?? 0}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Motivo da retificação</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Ex: valor digitado errado na conferência original"
              maxLength={1000}
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : "Retificar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
