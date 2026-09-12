"use client";

import { useActionState, useState } from "react";
import { Pencil } from "lucide-react";
import { updateExpenseOutflow, type ActionResult } from "@/app/actions/transparencia";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EXPENSE_TAG_LABELS } from "@/lib/format";
import type { ExpenseTag } from "@/lib/database.types";

const TAG_OPTIONS: ExpenseTag[] = ["empenho", "bonus", "descaminho"];

type ExpenseRow = {
  id: string;
  valor: number;
  local_destinado: string;
  responsavel_retirada: string;
  tag: ExpenseTag;
  observacoes: string | null;
};

export function ExpenseEditDialog({ expense }: { expense: ExpenseRow }) {
  const [open, setOpen] = useState(false);
  const [tag, setTag] = useState<ExpenseTag>(expense.tag);
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(updateExpenseOutflow, {});

  useActionFeedback(state, {
    successMessage: "Saída de caixa atualizada",
    onSuccess: () => setOpen(false),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setTag(expense.tag);
      }}
    >
      <DialogTrigger
        render={<Button variant="ghost" size="icon-sm" title="Editar saída" aria-label="Editar saída" />}
      >
        <Pencil className="h-3.5 w-3.5" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-4 w-4 text-gold" />
            Editar saída de caixa
          </DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="id" value={expense.id} />
          <input type="hidden" name="tag" value={tag} />
          <div className="space-y-2">
            <Label htmlFor="valor">Valor (R$)</Label>
            <CurrencyInput id="valor" name="valor" defaultValue={expense.valor} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="responsavelRetirada">Responsável pela retirada</Label>
            <Input
              id="responsavelRetirada"
              name="responsavelRetirada"
              defaultValue={expense.responsavel_retirada}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tag">Tipo de saída</Label>
            <Select value={tag} onValueChange={(value) => setTag((value as ExpenseTag) ?? expense.tag)}>
              <SelectTrigger id="tag" className="w-full">
                <SelectValue>{(value: string) => EXPENSE_TAG_LABELS[value] ?? value}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {TAG_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {EXPENSE_TAG_LABELS[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="localDestinado">Local destinado / finalidade</Label>
            <Input id="localDestinado" name="localDestinado" defaultValue={expense.local_destinado} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações (opcional)</Label>
            <Textarea id="observacoes" name="observacoes" rows={2} defaultValue={expense.observacoes ?? ""} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : "Salvar alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
