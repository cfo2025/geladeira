"use client";

import { useMemo, useState } from "react";
import { Search, ChevronLeft, ChevronRight, BanknoteArrowDown, HandCoins, ShoppingCart } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExpenseTagBadge } from "@/components/status-badge";
import { ExpenseActions } from "@/components/transparencia/expense-actions";
import { ProductPurchaseActions } from "@/components/transparencia/product-purchase-actions";
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

type PaymentRow = {
  id: string;
  admin_typed_amount: number | null;
  reviewed_at: string | null;
  user: { full_name: string } | null;
};

type PurchaseRow = {
  id: string;
  quantity: number;
  unit_cost: number;
  data_hora: string;
  observacoes: string | null;
  product: { name: string } | null;
  criado_por: { full_name: string } | null;
};

type LedgerRow =
  | {
      kind: "entrada";
      id: string;
      date: string;
      valor: number;
      title: string;
      subtitle: string | null;
    }
  | {
      kind: "saida";
      id: string;
      date: string;
      valor: number;
      tag: ExpenseTag;
      title: string;
      subtitle: string | null;
      observacoes: string | null;
      original: ExpenseRow;
    }
  | {
      kind: "compra";
      id: string;
      date: string;
      valor: number;
      title: string;
      subtitle: string | null;
      observacoes: string | null;
      original: PurchaseRow;
    };

const PAGE_SIZE = 10;

export function CashLedgerTable({
  expenses,
  payments,
  purchases,
}: {
  expenses: ExpenseRow[];
  payments: PaymentRow[];
  purchases: PurchaseRow[];
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);

  const rows = useMemo<LedgerRow[]>(() => {
    const entradas: LedgerRow[] = payments
      .filter((p) => p.reviewed_at)
      .map((p) => ({
        kind: "entrada",
        id: p.id,
        date: p.reviewed_at as string,
        valor: p.admin_typed_amount ?? 0,
        title: p.user?.full_name ?? "Pagamento",
        subtitle: "Pagamento via Pix",
      }));
    const saidas: LedgerRow[] = expenses.map((e) => ({
      kind: "saida",
      id: e.id,
      date: e.data_hora,
      valor: e.valor,
      tag: e.tag,
      title: e.local_destinado,
      subtitle: `Responsável: ${e.responsavel_retirada}${e.criado_por ? ` · Homologado por ${e.criado_por.full_name}` : ""}`,
      observacoes: e.observacoes,
      original: e,
    }));
    const compras: LedgerRow[] = purchases.map((p) => ({
      kind: "compra",
      id: p.id,
      date: p.data_hora,
      valor: p.unit_cost * p.quantity,
      title: p.product?.name ?? "Produto",
      subtitle: `${p.quantity}x a ${formatCurrency(p.unit_cost)}${p.criado_por ? ` · Registrado por ${p.criado_por.full_name}` : ""}`,
      observacoes: p.observacoes,
      original: p,
    }));
    return [...entradas, ...saidas, ...compras].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [expenses, payments, purchases]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.subtitle ?? "").toLowerCase().includes(q) ||
        ((r.kind === "saida" || r.kind === "compra") && (r.observacoes ?? "").toLowerCase().includes(q))
    );
  }, [rows, query]);

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
          placeholder="Buscar por nome, local ou responsável..."
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          className="h-9 w-full rounded-full border border-input bg-muted/40 pr-3 pl-9 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap text-center">Data e hora</TableHead>
              <TableHead className="text-center">Tipo</TableHead>
              <TableHead className="text-center">Valor</TableHead>
              <TableHead className="text-center">Descrição</TableHead>
              <TableHead className="text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((row) => (
              <TableRow
                key={`${row.kind}-${row.id}`}
                className={cn(
                  row.kind === "saida" && row.tag === "descaminho" && "bg-destructive/5 hover:bg-destructive/10"
                )}
              >
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatDateTimeFull(row.date)}
                </TableCell>
                <TableCell>
                  {row.kind === "entrada" ? (
                    <Badge className="border-transparent bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400">
                      Entrada
                    </Badge>
                  ) : row.kind === "compra" ? (
                    <Badge className="border-transparent bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400">
                      Compra de estoque
                    </Badge>
                  ) : (
                    <ExpenseTagBadge tag={row.tag} />
                  )}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right font-medium tabular-nums whitespace-nowrap",
                    row.kind === "entrada"
                      ? "text-green-600 dark:text-green-400"
                      : row.kind === "saida" && row.tag === "descaminho"
                        ? "text-destructive"
                        : row.kind === "compra"
                          ? "text-muted-foreground"
                          : undefined
                  )}
                >
                  {row.kind === "entrada" ? "+" : row.kind === "compra" ? "" : "−"}
                  {formatCurrency(row.valor)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {row.kind === "entrada" ? (
                      <HandCoins className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                    ) : row.kind === "compra" ? (
                      <ShoppingCart className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                    ) : (
                      <BanknoteArrowDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-medium">{row.title}</p>
                      {row.subtitle && (
                        <p className="truncate text-xs text-muted-foreground">{row.subtitle}</p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {row.kind === "saida" ? (
                    <ExpenseActions expense={row.original} />
                  ) : row.kind === "compra" ? (
                    <ProductPurchaseActions purchase={row.original} />
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
            {pageRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  {query ? "Nenhum lançamento encontrado." : "Nenhum lançamento registrado ainda."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {filtered.length > 0 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "lançamento" : "lançamentos"}
            {query && ` ${filtered.length === 1 ? "encontrado" : "encontrados"} de ${rows.length}`}
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
