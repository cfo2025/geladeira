"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Package, ChevronLeft, ChevronRight, Wallet } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { WithdrawalStatusBadge, PaymentStatusBadge } from "@/components/status-badge";
import { CancellationDialog } from "@/components/cancellation-dialog";
import { formatCurrency, formatDateTime } from "@/lib/format";

type Withdrawal = {
  id: string;
  quantity: number;
  unit_price_at_withdrawal: number;
  status: string;
  created_at: string;
  product: { name: string; image_url: string | null } | null;
  location: { id: string; name: string } | null;
};

type Payment = {
  id: string;
  status: string;
  created_at: string;
  user_declared_amount: number;
  admin_typed_amount: number | null;
};

type ExtratoRow =
  | { kind: "withdrawal"; id: string; created_at: string; withdrawal: Withdrawal }
  | { kind: "payment"; id: string; created_at: string; payment: Payment };

const ALL_LOCATIONS = "all";
const PERIOD_OPTIONS = [
  { value: "current_month", label: "Mês atual" },
  { value: "last_month", label: "Mês passado" },
  { value: "all", label: "Todo período" },
];
const STATUS_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "cancel_requested", label: "Cancelamento solicitado" },
  { value: "cancel_approved", label: "Cancelamento aprovado" },
  { value: "payment_pending", label: "Pagamento em análise" },
  { value: "payment_approved", label: "Pagamento concluído" },
];
const PAGE_SIZE_OPTIONS = [5, 10];

function isInPeriod(dateStr: string, period: string) {
  if (period === "all") return true;
  const now = new Date();
  const d = new Date(dateStr);
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  if (period === "current_month") return d >= startOfThisMonth;
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return d >= startOfLastMonth && d < startOfThisMonth;
}

export function ExtratoTable({
  withdrawals,
  payments,
  locations,
}: {
  withdrawals: Withdrawal[];
  payments: Payment[];
  locations: { id: string; name: string }[];
}) {
  const [locationId, setLocationId] = useState(ALL_LOCATIONS);
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("current_month");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);

  const rows = useMemo<ExtratoRow[]>(() => {
    const withdrawalRows: ExtratoRow[] = withdrawals.map((w) => ({
      kind: "withdrawal",
      id: w.id,
      created_at: w.created_at,
      withdrawal: w,
    }));
    const paymentRows: ExtratoRow[] = payments.map((p) => ({
      kind: "payment",
      id: p.id,
      created_at: p.created_at,
      payment: p,
    }));
    return [...withdrawalRows, ...paymentRows].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [withdrawals, payments]);

  function updateFilter(next: {
    location?: string;
    search?: string;
    period?: string;
    status?: string;
  }) {
    if (next.location !== undefined) setLocationId(next.location);
    if (next.search !== undefined) setSearch(next.search);
    if (next.period !== undefined) setPeriod(next.period);
    if (next.status !== undefined) setStatusFilter(next.status);
    setPage(0);
  }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rows.filter((row) => {
      if (!isInPeriod(row.created_at, period)) return false;

      if (statusFilter !== "all") {
        if (row.kind === "withdrawal") {
          if (statusFilter === "cancel_requested" && row.withdrawal.status !== "deletion_requested")
            return false;
          if (statusFilter === "cancel_approved" && row.withdrawal.status !== "cancelled") return false;
          if (statusFilter === "payment_pending" || statusFilter === "payment_approved") return false;
        } else {
          if (statusFilter === "payment_pending" && row.payment.status !== "pending") return false;
          if (statusFilter === "payment_approved" && row.payment.status !== "approved") return false;
          if (statusFilter === "cancel_requested" || statusFilter === "cancel_approved") return false;
        }
      }

      if (row.kind === "withdrawal") {
        if (locationId !== ALL_LOCATIONS && row.withdrawal.location?.id !== locationId) return false;
        if (query && !row.withdrawal.product?.name.toLowerCase().includes(query)) return false;
      } else {
        // pagamentos não têm local/produto — some do filtro de local, e só aparecem
        // na busca por produto se ela estiver vazia (senão ficariam "escondidos" sem contexto)
        if (locationId !== ALL_LOCATIONS) return false;
        if (query) return false;
      }
      return true;
    });
  }, [rows, locationId, search, period, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages - 1);
  const pageRows = filtered.slice(currentPage * pageSize, currentPage * pageSize + pageSize);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <span className="text-xs text-muted-foreground">Período</span>
          <Select value={period} onValueChange={(value) => updateFilter({ period: value ?? "current_month" })}>
            <SelectTrigger className="w-40">
              <SelectValue>{(value: string) => PERIOD_OPTIONS.find((o) => o.value === value)?.label}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <span className="text-xs text-muted-foreground">Status</span>
          <Select value={statusFilter} onValueChange={(value) => updateFilter({ status: value ?? "all" })}>
            <SelectTrigger className="w-52">
              <SelectValue>{(value: string) => STATUS_OPTIONS.find((o) => o.value === value)?.label}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <span className="text-xs text-muted-foreground">Local</span>
          <Select value={locationId} onValueChange={(value) => updateFilter({ location: value ?? ALL_LOCATIONS })}>
            <SelectTrigger className="w-44">
              <SelectValue>
                {(value: string) =>
                  value === ALL_LOCATIONS ? "Todos os locais" : locations.find((l) => l.id === value)?.name
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_LOCATIONS}>Todos os locais</SelectItem>
              {locations.map((loc) => (
                <SelectItem key={loc.id} value={loc.id}>
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-48 flex-1 space-y-1.5">
          <label htmlFor="search" className="text-xs text-muted-foreground">
            Buscar produto
          </label>
          <input
            id="search"
            placeholder="Ex: Coca-Cola"
            value={search}
            onChange={(e) => updateFilter({ search: e.target.value })}
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Data/Hora</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead className="text-right">Qtd.</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Valor</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((row) => (
                  <TableRow key={`${row.kind}-${row.id}`}>
                    {row.kind === "withdrawal" ? (
                      <>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {formatDateTime(row.withdrawal.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <span className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted/60">
                              {row.withdrawal.product?.image_url ? (
                                <Image
                                  src={row.withdrawal.product.image_url}
                                  alt={row.withdrawal.product.name}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              ) : (
                                <Package className="h-4 w-4 text-muted-foreground/50" />
                              )}
                            </span>
                            <span className="font-medium">{row.withdrawal.product?.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{row.withdrawal.location?.name}</TableCell>
                        <TableCell className="text-right tabular-nums">{row.withdrawal.quantity}</TableCell>
                        <TableCell className="text-right tabular-nums whitespace-nowrap">
                          {formatCurrency(row.withdrawal.unit_price_at_withdrawal)}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center">
                            <WithdrawalStatusBadge status={row.withdrawal.status} />
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {row.withdrawal.status === "completed" && (
                            <CancellationDialog
                              withdrawalId={row.withdrawal.id}
                              productName={row.withdrawal.product?.name ?? ""}
                            />
                          )}
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {formatDateTime(row.payment.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted/60">
                              <Wallet className="h-4 w-4 text-muted-foreground/70" />
                            </span>
                            <span className="font-medium">Pagamento declarado (Pix)</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">—</TableCell>
                        <TableCell className="text-right tabular-nums">—</TableCell>
                        <TableCell className="text-right tabular-nums whitespace-nowrap">
                          {formatCurrency(row.payment.admin_typed_amount ?? row.payment.user_declared_amount)}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center">
                            <PaymentStatusBadge status={row.payment.status} />
                          </div>
                        </TableCell>
                        <TableCell className="text-right" />
                      </>
                    )}
                  </TableRow>
                ))}
                {pageRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      Nenhum registro encontrado para os filtros selecionados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {filtered.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              {filtered.length} {filtered.length === 1 ? "registro" : "registros"}
            </span>
            <span className="flex items-center gap-1.5">
              Itens por página
              <Select
                value={String(pageSize)}
                onValueChange={(value) => {
                  setPageSize(Number(value ?? 5));
                  setPage(0);
                }}
              >
                <SelectTrigger className="h-7 w-auto px-2 text-xs">
                  <SelectValue>{(value: string) => value}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </span>
          </div>
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
