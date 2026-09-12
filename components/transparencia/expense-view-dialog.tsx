"use client";

import { Eye, BanknoteArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExpenseTagBadge } from "@/components/status-badge";
import { formatCurrency, formatDateTimeFull } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TONE_CLASSES } from "@/lib/log-presentation";
import type { ExpenseTag } from "@/lib/database.types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type ExpenseRow = {
  id: string;
  valor: number;
  data_hora: string;
  local_destinado: string;
  responsavel_retirada: string;
  tag: ExpenseTag;
  observacoes: string | null;
  criado_por: { full_name: string } | null;
};

export function ExpenseViewDialog({ expense }: { expense: ExpenseRow }) {
  const toneClasses = TONE_CLASSES[expense.tag === "descaminho" ? "red" : "amber"];

  return (
    <Dialog>
      <DialogTrigger
        render={<Button variant="ghost" size="icon-sm" title="Ver detalhes" aria-label="Ver detalhes" />}
      >
        <Eye className="h-3.5 w-3.5" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader className="sr-only">
          <DialogTitle>Detalhes da saída de caixa</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3 pt-2 text-center">
          <span className={cn("flex h-14 w-14 items-center justify-center rounded-full", toneClasses.bg)}>
            <BanknoteArrowDown className={cn("h-7 w-7", toneClasses.text)} />
          </span>
          <div>
            <p className="text-base font-semibold">{expense.local_destinado}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Responsável: {expense.responsavel_retirada}
            </p>
          </div>
          <ExpenseTagBadge tag={expense.tag} />
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          <div className="w-[calc(50%-0.25rem)] min-w-0 shrink-0 rounded-lg border bg-muted/40 px-3 py-2 text-center">
            <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">Valor</p>
            <p className="truncate text-sm font-semibold">{formatCurrency(expense.valor)}</p>
          </div>
          <div className="w-[calc(50%-0.25rem)] min-w-0 shrink-0 rounded-lg border bg-muted/40 px-3 py-2 text-center">
            <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
              Homologado por
            </p>
            <p className="truncate text-sm font-semibold">{expense.criado_por?.full_name ?? "—"}</p>
          </div>
        </div>

        {expense.observacoes && (
          <div className="rounded-lg border border-dashed px-3 py-2 text-center text-sm text-muted-foreground">
            {expense.observacoes}
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground">{formatDateTimeFull(expense.data_hora)}</p>
      </DialogContent>
    </Dialog>
  );
}
