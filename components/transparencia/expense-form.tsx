"use client";

import { useActionState, useRef, useState } from "react";
import { BanknoteArrowDown } from "lucide-react";
import { createExpenseOutflow, type ActionResult } from "@/app/actions/transparencia";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export function ExpenseForm({ availableBalance }: { availableBalance: number }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(createExpenseOutflow, {});
  const formRef = useRef<HTMLFormElement>(null);

  useActionFeedback(state, {
    successMessage: "Saída de caixa lançada",
    onSuccess: () => {
      formRef.current?.reset();
      setOpen(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <BanknoteArrowDown className="h-4 w-4" />
        Lançar despesa / saída
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BanknoteArrowDown className="h-4 w-4 text-gold" />
            Lançar despesa / saída
          </DialogTitle>
          <DialogDescription>
            Saldo em caixa disponível agora: <span className="font-semibold">{formatCurrency(availableBalance)}</span>
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="valor">Valor (R$)</Label>
            <CurrencyInput id="valor" name="valor" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="responsavelRetirada">Responsável pela retirada</Label>
            <Input
              id="responsavelRetirada"
              name="responsavelRetirada"
              placeholder="Nome de quem retirou/utilizou"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="localDestinado">Local destinado / finalidade</Label>
            <Input
              id="localDestinado"
              name="localDestinado"
              placeholder="Ex: Material de limpeza para sala de aula"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações (opcional)</Label>
            <Textarea id="observacoes" name="observacoes" rows={2} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Lançando..." : "Lançar saída"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
