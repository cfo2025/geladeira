"use client";

import { useActionState, useState } from "react";
import { requestCancellation, type ActionResult } from "@/app/actions/withdrawals";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function CancellationDialog({ withdrawalId, productName }: { withdrawalId: string; productName: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    requestCancellation,
    {}
  );

  useActionFeedback(state, {
    successMessage: "Solicitação de cancelamento enviada",
    onSuccess: () => setOpen(false),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        Solicitar cancelamento
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancelar retirada</DialogTitle>
          <DialogDescription>
            Explique o motivo do cancelamento de &quot;{productName}&quot;. Um administrador vai
            analisar o pedido.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="withdrawalId" value={withdrawalId} />
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo</Label>
            <Textarea id="reason" name="reason" required minLength={3} maxLength={500} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Enviando..." : "Enviar solicitação"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
