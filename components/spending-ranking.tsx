import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";

type RankingRow = { user_id: string; full_name: string; total_spent: number };

const MEDAL_STYLES = [
  "bg-gold/15 text-gold border-gold/30",
  "bg-muted text-foreground border-border",
  "bg-amber-900/10 text-amber-700 border-amber-700/20 dark:text-amber-500",
];

export function SpendingRanking({
  ranking,
  currentUserId,
}: {
  ranking: RankingRow[];
  currentUserId: string;
}) {
  return (
    <div className="divide-y">
      {ranking.map((row, idx) => {
        const isMe = row.user_id === currentUserId;
        return (
          <div
            key={row.user_id}
            className={cn(
              "flex items-center gap-3 px-1 py-2.5",
              isMe && "rounded-md bg-accent px-2"
            )}
          >
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                idx < 3 ? MEDAL_STYLES[idx] : "border-border text-muted-foreground"
              )}
            >
              {idx + 1}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium">
              {row.full_name}
              {isMe && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(você)</span>}
            </span>
            <span className="text-sm font-semibold tabular-nums">{formatCurrency(row.total_spent)}</span>
          </div>
        );
      })}
      {ranking.length === 0 && (
        <p className="py-6 text-center text-sm text-muted-foreground">Nenhum gasto registrado ainda.</p>
      )}
    </div>
  );
}
