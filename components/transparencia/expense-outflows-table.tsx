"use client";

import { useMemo, useState } from "react";
import { Search, ChevronLeft, ChevronRight, BanknoteArrowDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ExpenseTagBadge } from "@/components/status-badge";
import { formatCurrency, formatDateTimeFull } from "@/lib/format";
import { cn } from "@/lib/utils";
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

const PAGE_SIZE = 10;

export function ExpenseOutflowsTable({ expenses }: { expenses: ExpenseRow[] }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return expenses;
    return expenses.filter(
      (e) =>
        e.local_destinado.toLowerCase().includes(q) ||
        e.responsavel_retirada.toLowerCase().includes(q) ||
        (e.criado_por?.full_name ?? "").toLowerCase().includes(q)
    );
  }, [expenses, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const pageRows = filtered.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);

  function handleQueryChange(value: string) {
    setQuery(value);
    setPage(0);
  }

  return (
    <div className="space-y-4">
      <div className="relative w-full max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="Buscar por local, responsável ou quem lançou..."
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          className="h-9 w-full rounded-full border border-input bg-muted/40 pr-3 pl-9 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">Data e hora</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Local / finalidade</TableHead>
              <TableHead>Responsável pela retirada</TableHead>
              <TableHead>Homologado por</TableHead>
              <TableHead>Observações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((expense) => (
              <TableRow
                key={expense.id}
                className={cn(
                  expense.tag === "descaminho" && "bg-destructive/5 hover:bg-destructive/10"
                )}
              >
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatDateTimeFull(expense.data_hora)}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right font-medium tabular-nums whitespace-nowrap",
                    expense.tag === "descaminho" && "text-destructive"
                  )}
                >
                  {formatCurrency(expense.valor)}
                </TableCell>
                <TableCell>
                  <ExpenseTagBadge tag={expense.tag} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <BanknoteArrowDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                    {expense.local_destinado}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{expense.responsavel_retirada}</TableCell>
                <TableCell className="text-muted-foreground">{expense.criado_por?.full_name ?? "—"}</TableCell>
                <TableCell className="max-w-56 truncate text-muted-foreground" title={expense.observacoes ?? undefined}>
                  {expense.observacoes ?? "—"}
                </TableCell>
              </TableRow>
            ))}
            {pageRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  {query ? "Nenhuma saída encontrada." : "Nenhuma saída de caixa registrada ainda."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {filtered.length > 0 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "saída" : "saídas"}
            {query && ` ${filtered.length === 1 ? "encontrada" : "encontradas"} de ${expenses.length}`}
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon-sm"
                disabled={currentPage === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                aria-label="Página anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground">
                Página {currentPage + 1} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon-sm"
                disabled={currentPage >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                aria-label="Próxima página"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
