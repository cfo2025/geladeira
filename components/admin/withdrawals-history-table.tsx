"use client";

import { useMemo, useState } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WithdrawalStatusBadge } from "@/components/status-badge";
import { formatCurrency, formatDateTime, WITHDRAWAL_STATUS_LABELS } from "@/lib/format";
import type { WithdrawalStatus } from "@/lib/database.types";

type WithdrawalRow = {
  id: string;
  created_at: string;
  quantity: number;
  unit_price_at_withdrawal: number;
  status: WithdrawalStatus;
  profile: { full_name: string } | null;
  product: { name: string } | null;
  location: { name: string } | null;
};

const PAGE_SIZE = 10;

export function WithdrawalsHistoryTable({
  withdrawals,
  locations,
}: {
  withdrawals: WithdrawalRow[];
  locations: { id: string; name: string }[];
}) {
  const [query, setQuery] = useState("");
  const [date, setDate] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return withdrawals.filter((w) => {
      const matchesQuery =
        !q ||
        (w.profile?.full_name ?? "").toLowerCase().includes(q) ||
        (w.product?.name ?? "").toLowerCase().includes(q);
      const matchesDate = !date || w.created_at.slice(0, 10) === date;
      const matchesLocation = locationFilter === "all" || w.location?.name === locationFilter;
      const matchesStatus = statusFilter === "all" || w.status === statusFilter;
      return matchesQuery && matchesDate && matchesLocation && matchesStatus;
    });
  }, [withdrawals, query, date, locationFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const pageRows = filtered.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);

  const hasFilters = query || date || locationFilter !== "all" || statusFilter !== "all";

  function updateFilter(next: {
    query?: string;
    date?: string;
    location?: string;
    status?: string;
  }) {
    if (next.query !== undefined) setQuery(next.query);
    if (next.date !== undefined) setDate(next.date);
    if (next.location !== undefined) setLocationFilter(next.location);
    if (next.status !== undefined) setStatusFilter(next.status);
    setPage(0);
  }

  function clearFilters() {
    setQuery("");
    setDate("");
    setLocationFilter("all");
    setStatusFilter("all");
    setPage(0);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Buscar por nome ou produto..."
            value={query}
            onChange={(e) => updateFilter({ query: e.target.value })}
            className="h-9 w-full rounded-full border border-input bg-muted/40 pr-3 pl-9 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
        <Input
          type="date"
          value={date}
          onChange={(e) => updateFilter({ date: e.target.value })}
          className="w-auto"
        />
        <Select value={locationFilter} onValueChange={(value) => updateFilter({ location: value ?? "all" })}>
          <SelectTrigger className="w-auto">
            <SelectValue>{(value: string) => (value === "all" ? "Todas as geladeiras" : value)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as geladeiras</SelectItem>
            {locations.map((loc) => (
              <SelectItem key={loc.id} value={loc.name}>
                {loc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(value) => updateFilter({ status: value ?? "all" })}>
          <SelectTrigger className="w-auto">
            <SelectValue>
              {(value: string) => (value === "all" ? "Todos os status" : WITHDRAWAL_STATUS_LABELS[value])}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(WITHDRAWAL_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
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
              <TableHead>Produto</TableHead>
              <TableHead>Local</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((w) => (
              <TableRow key={w.id}>
                <TableCell className="whitespace-nowrap">{formatDateTime(w.created_at)}</TableCell>
                <TableCell>{w.profile?.full_name}</TableCell>
                <TableCell>{w.product?.name}</TableCell>
                <TableCell>{w.location?.name}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(w.unit_price_at_withdrawal * w.quantity)}
                </TableCell>
                <TableCell>
                  <WithdrawalStatusBadge status={w.status} />
                </TableCell>
              </TableRow>
            ))}
            {pageRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  {hasFilters ? "Nenhuma retirada encontrada." : "Nenhuma retirada registrada."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {filtered.length > 0 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "retirada" : "retiradas"}
            {hasFilters && ` ${filtered.length === 1 ? "encontrada" : "encontradas"} de ${withdrawals.length}`}
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
