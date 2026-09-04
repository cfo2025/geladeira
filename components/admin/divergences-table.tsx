"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight, Eraser, Eye } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { applyStockAuditItem } from "@/app/actions/admin/audits";
import { formatDateTime } from "@/lib/format";

type DivergenceRow = {
  id: string;
  audit_id: string;
  created_at: string;
  location_name: string;
  product_name: string;
  expected_quantity: number;
  physical_quantity: number;
  difference: number;
  applied_at: string | null;
};

const PAGE_SIZE = 8;

export function DivergencesTable({
  divergences,
  locations,
}: {
  divergences: DivergenceRow[];
  locations: { id: string; name: string }[];
}) {
  const [query, setQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return divergences
      .filter((d) => !d.applied_at)
      .filter((d) => {
        const matchesQuery = !q || d.product_name.toLowerCase().includes(q);
        const matchesLocation = locationFilter === "all" || d.location_name === locationFilter;
        return matchesQuery && matchesLocation;
      });
  }, [divergences, query, locationFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const pageRows = filtered.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);

  function handleFilterChange(next: { query?: string; location?: string }) {
    if (next.query !== undefined) setQuery(next.query);
    if (next.location !== undefined) setLocationFilter(next.location);
    setPage(0);
  }

  function handleApply(itemId: string) {
    setPendingId(itemId);
    startTransition(async () => {
      const result = await applyStockAuditItem(itemId);
      if (result.error) toast.error(result.error);
      else toast.success("Ajuste aplicado ao estoque");
      setPendingId(null);
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Buscar produto..."
            value={query}
            onChange={(e) => handleFilterChange({ query: e.target.value })}
            className="h-9 w-full rounded-full border border-input bg-muted/40 pr-3 pl-9 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
        <Select
          value={locationFilter}
          onValueChange={(value) => handleFilterChange({ location: value ?? "all" })}
        >
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
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Geladeira</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead className="text-right">Diferença</TableHead>
              <TableHead className="text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatDateTime(row.created_at)}
                </TableCell>
                <TableCell>{row.location_name}</TableCell>
                <TableCell className="font-medium">{row.product_name}</TableCell>
                <TableCell
                  className={`text-right font-semibold tabular-nums ${
                    row.difference < 0 ? "text-destructive" : "text-green-600 dark:text-green-400"
                  }`}
                >
                  {row.difference > 0 ? `+${row.difference}` : row.difference}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      render={<Link href={`/admin/auditoria/${row.audit_id}`} />}
                      nativeButton={false}
                      variant="ghost"
                      size="icon-sm"
                      title="Ver balanço"
                      aria-label="Ver balanço"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      disabled={pendingId === row.id}
                      onClick={() => handleApply(row.id)}
                      title="Zerar divergência (aplica a contagem física ao estoque)"
                      aria-label="Zerar divergência"
                    >
                      <Eraser className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {pageRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  {query || locationFilter !== "all"
                    ? "Nenhuma divergência encontrada."
                    : "Nenhuma divergência registrada."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {filtered.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Página {currentPage + 1} de {totalPages}
          </p>
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
        </div>
      )}
    </div>
  );
}
