"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight, Eye, ClipboardList } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WithdrawalStatusBadge } from "@/components/status-badge";
import { formatCurrency, formatDateTime, WITHDRAWAL_STATUS_LABELS } from "@/lib/format";
import type { WithdrawalStatus } from "@/lib/database.types";

type WithdrawalActivity = {
  kind: "withdrawal";
  id: string;
  created_at: string;
  quantity: number;
  unit_price_at_withdrawal: number;
  status: WithdrawalStatus;
  user_name: string | null;
  product_name: string | null;
  location_name: string | null;
};

type AuditActivity = {
  kind: "audit";
  id: string;
  created_at: string;
  user_name: string | null;
  location_name: string | null;
};

export type ActivityRow = WithdrawalActivity | AuditActivity;

const PAGE_SIZE = 10;
const AUDIT_STATUS_VALUE = "stock_audit";

export function WithdrawalsHistoryTable({
  rows,
  locations,
}: {
  rows: ActivityRow[];
  locations: { id: string; name: string }[];
}) {
  const [query, setQuery] = useState("");
  const [date, setDate] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      const productName = row.kind === "withdrawal" ? row.product_name : null;
      const matchesQuery =
        !q ||
        (row.user_name ?? "").toLowerCase().includes(q) ||
        (productName ?? "").toLowerCase().includes(q);
      const matchesDate = !date || row.created_at.slice(0, 10) === date;
      const matchesLocation = locationFilter === "all" || row.location_name === locationFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (row.kind === "audit" ? statusFilter === AUDIT_STATUS_VALUE : row.status === statusFilter);
      return matchesQuery && matchesDate && matchesLocation && matchesStatus;
    });
  }, [rows, query, date, locationFilter, statusFilter]);

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
              {(value: string) =>
                value === "all"
                  ? "Todos os status"
                  : value === AUDIT_STATUS_VALUE
                    ? "Ajuste de estoque"
                    : WITHDRAWAL_STATUS_LABELS[value]
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(WITHDRAWAL_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
            <SelectItem value={AUDIT_STATUS_VALUE}>Ajuste de estoque</SelectItem>
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
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((row) =>
              row.kind === "withdrawal" ? (
                <TableRow key={`w-${row.id}`}>
                  <TableCell className="whitespace-nowrap">{formatDateTime(row.created_at)}</TableCell>
                  <TableCell>{row.user_name}</TableCell>
                  <TableCell>{row.product_name}</TableCell>
                  <TableCell>{row.location_name}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(row.unit_price_at_withdrawal * row.quantity)}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <WithdrawalStatusBadge status={row.status} />
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">—</TableCell>
                </TableRow>
              ) : (
                <TableRow key={`a-${row.id}`} className="bg-amber-50/60 dark:bg-amber-500/5">
                  <TableCell className="whitespace-nowrap">{formatDateTime(row.created_at)}</TableCell>
                  <TableCell>{row.user_name}</TableCell>
                  <TableCell className="text-muted-foreground">—</TableCell>
                  <TableCell>{row.location_name}</TableCell>
                  <TableCell className="text-right text-muted-foreground">—</TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <Badge className="gap-1 border-transparent bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                        <ClipboardList className="h-3 w-3" />
                        Ajuste de estoque
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      render={<Link href={`/admin/auditoria/${row.id}`} />}
                      nativeButton={false}
                      variant="ghost"
                      size="icon-sm"
                      title="Ver balanço"
                      aria-label="Ver balanço"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            )}
            {pageRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  {hasFilters ? "Nenhum registro encontrado." : "Nenhuma retirada registrada."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {filtered.length > 0 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "registro" : "registros"}
            {hasFilters && ` ${filtered.length === 1 ? "encontrado" : "encontrados"} de ${rows.length}`}
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
