"use client";

import { useMemo, useState } from "react";
import { Search, ChevronLeft, ChevronRight, HandCoins, ArrowRight, CalendarClock, TrendingUp, Landmark } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KpiStrip, type KpiItem } from "@/components/kpi-strip";
import { formatCurrency, formatDateTime } from "@/lib/format";

export type DebtorRow = {
  user_id: string;
  full_name: string;
  total_consumed: number;
  total_paid: number;
  balance: number;
  last_payment_amount: number | null;
  last_payment_at: string | null;
  last_payment_status: string | null;
  has_pending_payment: boolean;
};

const PAGE_SIZE = 10;

export function DebtorsTab({
  debtors,
  pendingTotal,
  paidLastMonth,
  paidThisMonth,
  paidAllTime,
  onGoToApproval,
}: {
  debtors: DebtorRow[];
  pendingTotal: number;
  paidLastMonth: number;
  paidThisMonth: number;
  paidAllTime: number;
  onGoToApproval: () => void;
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return debtors;
    return debtors.filter((d) => d.full_name.toLowerCase().includes(q));
  }, [debtors, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const pageRows = filtered.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);

  function handleQueryChange(value: string) {
    setQuery(value);
    setPage(0);
  }

  const stats: KpiItem[] = [
    { label: "Pagamento pendente", value: formatCurrency(pendingTotal), icon: HandCoins },
    { label: "Mês passado", value: formatCurrency(paidLastMonth), icon: CalendarClock },
    { label: "Mês atual", value: formatCurrency(paidThisMonth), icon: TrendingUp },
    { label: "Período total", value: formatCurrency(paidAllTime), icon: Landmark },
  ];

  return (
    <div className="space-y-6">
      <KpiStrip items={stats} />

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            Quem deve mais
          </h2>
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Buscar por nome..."
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              className="h-9 w-full rounded-full border border-input bg-muted/40 pr-3 pl-9 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead className="text-right">Saldo em aberto</TableHead>
                <TableHead className="text-right">Último pagamento</TableHead>
                <TableHead className="whitespace-nowrap">Data</TableHead>
                <TableHead className="text-center">Pendente</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.map((d, idx) => (
                <TableRow key={d.user_id}>
                  <TableCell className="text-center text-xs text-muted-foreground">
                    {currentPage * PAGE_SIZE + idx + 1}
                  </TableCell>
                  <TableCell className="font-medium">{d.full_name}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    <span className={d.balance > 0 ? "font-semibold text-destructive" : "text-muted-foreground"}>
                      {formatCurrency(d.balance)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {d.last_payment_amount !== null ? formatCurrency(d.last_payment_amount) : "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {d.last_payment_at ? formatDateTime(d.last_payment_at) : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      {d.has_pending_payment ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 gap-1.5 border-amber-300 text-xs text-amber-700 hover:bg-amber-50 dark:border-amber-500/40 dark:text-amber-400 dark:hover:bg-amber-500/10"
                          onClick={onGoToApproval}
                        >
                          <Badge className="border-transparent bg-amber-100 px-1.5 py-0 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                            Aguardando
                          </Badge>
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {pageRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    {query ? "Nenhum usuário encontrado." : "Nenhum usuário ativo."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {filtered.length > 0 && (
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {filtered.length} {filtered.length === 1 ? "usuário" : "usuários"}
              {query && ` de ${debtors.length}`}
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
    </div>
  );
}
