"use client";

import { useMemo, useState } from "react";
import { Search, ChevronLeft, ChevronRight, Trophy, Medal, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";

type RankingRow = { user_id: string; full_name: string; total_spent: number };
type PositionedRow = { row: RankingRow; position: number };

const MEDAL_ICONS = [Trophy, Medal, Award];
const MEDAL_COLORS = ["text-gold", "text-slate-400", "text-amber-700 dark:text-amber-600"];
const TOP_COUNT = 10;
const PAGE_SIZE = 10;

function RankingRowView({
  row,
  position,
  isMe,
  total,
}: {
  row: RankingRow;
  position: number;
  isMe: boolean;
  total: number;
}) {
  const share = total > 0 ? (row.total_spent / total) * 100 : 0;
  const initials = row.full_name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
  const MedalIcon = position <= 3 ? MEDAL_ICONS[position - 1] : undefined;

  return (
    <div
      className={cn("flex items-center gap-3 px-1 py-2.5", isMe && "rounded-md bg-accent px-2")}
    >
      <span className="w-5 shrink-0 text-center text-sm font-semibold text-muted-foreground">
        {position}
      </span>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
        {initials}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {row.full_name}
          {isMe && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(você)</span>}
        </p>
        <p className="text-xs text-muted-foreground">{share.toFixed(1)}% do total da turma</p>
      </div>
      <span className="text-sm font-semibold tabular-nums">{formatCurrency(row.total_spent)}</span>
      {MedalIcon && <MedalIcon className={cn("h-4 w-4 shrink-0", MEDAL_COLORS[position - 1])} />}
    </div>
  );
}

export function SpendingRanking({
  ranking,
  currentUserId,
}: {
  ranking: RankingRow[];
  currentUserId: string;
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);

  const total = useMemo(() => ranking.reduce((sum, r) => sum + r.total_spent, 0), [ranking]);

  const indexed = useMemo<PositionedRow[]>(
    () => ranking.map((row, idx) => ({ row, position: idx + 1 })),
    [ranking]
  );

  const q = query.trim().toLowerCase();
  const isSearching = q.length > 0;

  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    return indexed.filter(({ row }) => row.full_name.toLowerCase().includes(q));
  }, [indexed, q, isSearching]);

  const top10 = isSearching ? [] : indexed.slice(0, TOP_COUNT);
  const paginated = isSearching ? searchResults : indexed.slice(TOP_COUNT);

  const totalPages = Math.max(1, Math.ceil(paginated.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const pageRows = paginated.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);

  function handleQueryChange(value: string) {
    setQuery(value);
    setPage(0);
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="Buscar por nome..."
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          className="h-9 w-full rounded-full border border-input bg-muted/40 pr-3 pl-9 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <div className="divide-y">
        {top10.map(({ row, position }) => (
          <RankingRowView
            key={row.user_id}
            row={row}
            position={position}
            isMe={row.user_id === currentUserId}
            total={total}
          />
        ))}
        {pageRows.map(({ row, position }) => (
          <RankingRowView
            key={row.user_id}
            row={row}
            position={position}
            isMe={row.user_id === currentUserId}
            total={total}
          />
        ))}
        {ranking.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">Nenhum gasto registrado ainda.</p>
        )}
        {isSearching && searchResults.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">Ninguém encontrado com esse nome.</p>
        )}
      </div>

      {paginated.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {isSearching
              ? `${paginated.length} ${paginated.length === 1 ? "resultado" : "resultados"}`
              : `Posições ${TOP_COUNT + 1}+`}
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
        </div>
      )}
    </div>
  );
}
