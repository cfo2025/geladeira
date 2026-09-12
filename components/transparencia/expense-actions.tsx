"use client";

import { deleteExpenseOutflow } from "@/app/actions/transparencia";
import { ConfirmDeleteDialog } from "@/components/admin/confirm-delete-dialog";
import { ExpenseViewDialog } from "@/components/transparencia/expense-view-dialog";
import { ExpenseEditDialog } from "@/components/transparencia/expense-edit-dialog";
import { formatCurrency } from "@/lib/format";
import type { ExpenseTag } from "@/lib/database.types";

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

/** Ver detalhes / editar / excluir uma saída de caixa — admin/ordenador de
 *  despesa. Toda edição e exclusão fica registrada em Logs (mexe no
 *  saldo/balanço da loja). */
export function ExpenseActions({ expense }: { expense: ExpenseRow }) {
  return (
    <div className="flex justify-end gap-1">
      <ExpenseViewDialog expense={expense} />
      <ExpenseEditDialog expense={expense} />
      <ConfirmDeleteDialog
        title="Excluir saída de caixa"
        description={`Isso remove permanentemente o lançamento de "${expense.local_destinado}" (${formatCurrency(expense.valor)}). Fica registrado nos Logs. Esta ação não pode ser desfeita.`}
        action={() => deleteExpenseOutflow(expense.id)}
      />
    </div>
  );
}
