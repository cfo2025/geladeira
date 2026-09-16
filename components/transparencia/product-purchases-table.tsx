"use client";

import { useMemo, useState } from "react";
import { Search, ChevronLeft, ChevronRight, Package } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDateTimeFull } from "@/lib/format";

type PurchaseRow = {
  id: string;
  quantity: number;
  unit_cost: number;
  data_hora: string;
  observacoes: string | null;
  product: { name: string } | null;
  criado_por: { full_name: string } | null;
};

const PAGE_SIZE = 10;

/** Histórico de compras de produto pra repor estoque — não mexe no saldo em
 *  caixa (isso é lançado à parte, em "Lançar despesa", se o admin quiser
 *  refletir a saída), só alimenta o custo médio ponderado e o lucro. */
export function ProductPurchasesTable({ purchases }: { purchases: PurchaseRow[] }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return purchases;
    return purchases.filter(
      (p) =>
        (p.product?.name ?? "").toLowerCase().includes(q) ||
        (p.criado_por?.full_name ?? "").toLowerCase().includes(q)
    );
  }, [purchases, query]);

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
          placeholder="Buscar por produto ou responsável..."
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
              <TableHead className="text-center">Produto</TableHead>
              <TableHead className="text-center">Quantidade</TableHead>
              <TableHead className="text-center">Custo unitário</TableHead>
              <TableHead className="text-center">Custo total</TableHead>
              <TableHead className="text-center">Registrado por</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((purchase) => (
              <TableRow key={purchase.id}>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatDateTimeFull(purchase.data_hora)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Package className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{purchase.product?.name ?? "—"}</p>
                      {purchase.observacoes && (
                        <p className="truncate text-xs text-muted-foreground">{purchase.observacoes}</p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center tabular-nums">{purchase.quantity}</TableCell>
                <TableCell className="text-right tabular-nums whitespace-nowrap">
                  {formatCurrency(purchase.unit_cost)}
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums whitespace-nowrap">
                  {formatCurrency(purchase.unit_cost * purchase.quantity)}
                </TableCell>
                <TableCell className="text-muted-foreground">{purchase.criado_por?.full_name ?? "—"}</TableCell>
              </TableRow>
            ))}
            {pageRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  {query ? "Nenhuma compra encontrada." : "Nenhuma compra de produto registrada ainda."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {filtered.length > 0 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "compra" : "compras"}
            {query && ` ${filtered.length === 1 ? "encontrada" : "encontradas"} de ${purchases.length}`}
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
