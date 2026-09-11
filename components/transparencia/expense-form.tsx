"use client";

import { useActionState, useRef, useState } from "react";
import { ChevronDown, BanknoteArrowDown } from "lucide-react";
import { createExpenseOutflow, type ActionResult } from "@/app/actions/transparencia";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Collapsible, CollapsibleTrigger, CollapsiblePanel } from "@/components/ui/collapsible";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

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
    <Card>
      <CardContent className="pt-6">
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger
            render={
              <button
                type="button"
                className="flex w-full items-center justify-between text-left text-sm font-semibold"
              />
            }
          >
            <span className="flex items-center gap-2">
              <BanknoteArrowDown className="h-4 w-4 text-gold" />
              Lançar despesa / saída
            </span>
            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
          </CollapsibleTrigger>
          <CollapsiblePanel>
            <form ref={formRef} action={formAction} className="space-y-4 pt-4">
              <p className="text-xs text-muted-foreground">
                Saldo em caixa disponível agora: <span className="font-semibold">{formatCurrency(availableBalance)}</span>
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
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
              <Button type="submit" disabled={pending}>
                {pending ? "Lançando..." : "Lançar saída"}
              </Button>
            </form>
          </CollapsiblePanel>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
