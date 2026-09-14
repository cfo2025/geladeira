"use client";

import { useActionState, useState } from "react";
import { Trash2 } from "lucide-react";
import { removePayment, type ActionResult } from "@/app/actions/admin/payments";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import { Button } from "@/components/ui/button";
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
import { formatCurrency } from "@/lib/format";

export function RemovePaymentDialog({
  paymentId,
  userName,
  amount,
}: {
  paymentId: string;
  userName: string;
  amount: number | null;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(removePayment, {});

  useActionFeedback(state, {
    successMessage: "Pagamento removido",
    onSuccess: () => setOpen(false),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            title="Remover pagamento"
            aria-label="Remover pagamento"
          />
        }
      >
        <Trash2 className="h-3.5 w-3.5" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-destructive" />
            Remover pagamento de {userName}
          </DialogTitle>
          <DialogDescription>
            Isso apaga o pagamento de {amount !== null ? formatCurrency(amount) : "—"} permanentemente e
            recalcula o saldo devedor de {userName}. Fica registrado nos Logs. Esta ação não pode ser
            desfeita.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="paymentId" value={paymentId} />
          <div className="space-y-2">
            <Label htmlFor="notes">Motivo da remoção</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Ex: aprovado por engano — o Pix nunca foi recebido"
              maxLength={1000}
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? "Removendo..." : "Remover pagamento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
