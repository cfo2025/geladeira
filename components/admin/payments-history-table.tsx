"use client";

import { useMemo, useState } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PaymentStatusBadge } from "@/components/status-badge";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { PaymentStatus } from "@/lib/database.types";

type PaymentRow = {
  id: string;
  created_at: string;
  expected_amount: number;
  admin_typed_amount: number | null;
  status: PaymentStatus;
  profile: { full_name: string } | null;
  reviewer: { full_name: string } | null;
};

const PAGE_SIZE = 10;

export function PaymentsHistoryTable({ payments }: { payments: PaymentRow[] }) {
  const [query, setQuery] = useState("");
  const [date, setDate] = useState("");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return payments.filter((p) => {
      const matchesQuery = !q || (p.profile?.full_name ?? "").toLowerCase().includes(q);
      const matchesDate = !date || p.created_at.slice(0, 10) === date;
      return matchesQuery && matchesDate;
    });
  }, [payments, query, date]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const pagePayments = filtered.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);

  function handleFilterChange(next: { query?: string; date?: string }) {
    if (next.query !== undefined) setQuery(next.query);
    if (next.date !== undefined) setDate(next.date);
    setPage(0);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Buscar por nome..."
            value={query}
            onChange={(e) => handleFilterChange({ query: e.target.value })}
            className="h-9 w-full rounded-full border border-input bg-muted/40 pr-3 pl-9 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
        <Input
          type="date"
          value={date}
          onChange={(e) => handleFilterChange({ date: e.target.value })}
          className="w-auto"
        />
        {(query || date) && (
          <Button variant="ghost" size="sm" onClick={() => handleFilterChange({ query: "", date: "" })}>
            Limpar filtros
          </Button>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead className="text-right">Esperado</TableHead>
              <TableHead className="text-right">Conferido</TableHead>
              <TableHead>Aprovado por</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagePayments.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="whitespace-nowrap">{formatDateTime(p.created_at)}</TableCell>
                <TableCell>{p.profile?.full_name}</TableCell>
                <TableCell className="text-right">{formatCurrency(p.expected_amount)}</TableCell>
                <TableCell className="text-right">
                  {p.admin_typed_amount !== null ? formatCurrency(p.admin_typed_amount) : "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">{p.reviewer?.full_name ?? "—"}</TableCell>
                <TableCell>
                  <PaymentStatusBadge status={p.status} />
                </TableCell>
              </TableRow>
            ))}
            {pagePayments.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  {query || date ? "Nenhum pagamento encontrado." : "Nenhum pagamento revisado ainda."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {filtered.length > 0 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "pagamento" : "pagamentos"}
            {(query || date) && ` ${filtered.length === 1 ? "encontrado" : "encontrados"} de ${payments.length}`}
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
