"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { WithdrawalStatusBadge } from "@/components/status-badge";
import { CancellationDialog } from "@/components/cancellation-dialog";
import { formatCurrency, formatDateTime } from "@/lib/format";

type Withdrawal = {
  id: string;
  quantity: number;
  unit_price_at_withdrawal: number;
  status: string;
  payment_id: string | null;
  created_at: string;
  product: { name: string; image_url: string | null } | null;
  location: { id: string; name: string } | null;
};

const ALL_LOCATIONS = "all";

export function ExtratoTable({
  withdrawals,
  locations,
}: {
  withdrawals: Withdrawal[];
  locations: { id: string; name: string }[];
}) {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [locationId, setLocationId] = useState(ALL_LOCATIONS);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const from = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const to = dateTo ? new Date(`${dateTo}T23:59:59`) : null;
    const query = search.trim().toLowerCase();

    return withdrawals.filter((w) => {
      const createdAt = new Date(w.created_at);
      if (from && createdAt < from) return false;
      if (to && createdAt > to) return false;
      if (locationId !== ALL_LOCATIONS && w.location?.id !== locationId) return false;
      if (query && !w.product?.name.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [withdrawals, dateFrom, dateTo, locationId, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="dateFrom" className="text-xs text-muted-foreground">
            Data início
          </Label>
          <Input
            id="dateFrom"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dateTo" className="text-xs text-muted-foreground">
            Data fim
          </Label>
          <Input
            id="dateTo"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Local</Label>
          <Select value={locationId} onValueChange={(value) => setLocationId(value ?? ALL_LOCATIONS)}>
            <SelectTrigger className="w-44">
              <SelectValue>
                {(value: string) =>
                  value === ALL_LOCATIONS
                    ? "Todos os locais"
                    : locations.find((l) => l.id === value)?.name
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
          <Label htmlFor="search" className="text-xs text-muted-foreground">
            Buscar produto
          </Label>
          <Input
            id="search"
            placeholder="Ex: Coca-Cola"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
                  <TableHead>Produto</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead className="text-right">Qtd.</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Valor Unit.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDateTime(w.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <span className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted/60">
                          {w.product?.image_url ? (
                            <Image
                              src={w.product.image_url}
                              alt={w.product.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <Package className="h-4 w-4 text-muted-foreground/50" />
                          )}
                        </span>
                        <span className="font-medium">{w.product?.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{w.location?.name}</TableCell>
                    <TableCell className="text-right tabular-nums">{w.quantity}</TableCell>
                    <TableCell className="text-right tabular-nums whitespace-nowrap">
                      {formatCurrency(w.unit_price_at_withdrawal)}
                    </TableCell>
                    <TableCell>
                      <WithdrawalStatusBadge status={w.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {w.status === "completed" && !w.payment_id && (
                        <CancellationDialog withdrawalId={w.id} productName={w.product?.name ?? ""} />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      Nenhuma retirada encontrada para os filtros selecionados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
