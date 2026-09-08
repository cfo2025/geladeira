"use client";

import { useMemo, useState } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  HandCoins,
  ArrowRight,
  CalendarClock,
  TrendingUp,
  Landmark,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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

const PAGE_SIZE = 12;

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

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {pageRows.map((d, idx) => (
            <Card key={d.user_id} size="sm">
              <CardContent className="space-y-2 pt-3">
                <div className="flex items-start justify-between gap-1.5">
                  <p className="min-w-0 truncate text-sm font-medium">
                    <span className="mr-1 text-xs text-muted-foreground">
                      {currentPage * PAGE_SIZE + idx + 1}º
                    </span>
                    {d.full_name}
                  </p>
                  {d.has_pending_payment && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="shrink-0 text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-500/10"
                      onClick={onGoToApproval}
                      aria-label="Ver pagamento pendente"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                <p
                  className={
                    d.balance > 0
                      ? "text-lg font-bold tabular-nums text-destructive"
                      : "text-lg font-bold tabular-nums text-muted-foreground"
                  }
                >
                  {formatCurrency(d.balance)}
                </p>

                {d.has_pending_payment && (
                  <Badge className="border-transparent bg-amber-100 px-1.5 py-0 text-[10px] text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                    Pagamento pendente
                  </Badge>
                )}

                <div className="space-y-0.5 border-t pt-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Últ. pagamento</span>
                    <span className="font-medium tabular-nums">
                      {d.last_payment_amount !== null ? formatCurrency(d.last_payment_amount) : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Data</span>
                    <span className="font-medium whitespace-nowrap">
                      {d.last_payment_at ? formatDateTime(d.last_payment_at) : "—"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {pageRows.length === 0 && (
            <p className="col-span-full py-10 text-center text-sm text-muted-foreground">
              {query ? "Nenhum usuário encontrado." : "Nenhum usuário ativo."}
            </p>
          )}
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
