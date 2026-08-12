import { Trophy, Medal, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";

type RankingRow = { user_id: string; full_name: string; total_spent: number };

const MEDAL_ICONS = [Trophy, Medal, Award];
const MEDAL_COLORS = ["text-gold", "text-slate-400", "text-amber-700 dark:text-amber-600"];

export function SpendingRanking({
  ranking,
  currentUserId,
}: {
  ranking: RankingRow[];
  currentUserId: string;
}) {
  const total = ranking.reduce((sum, r) => sum + r.total_spent, 0);

  return (
    <div className="divide-y">
      {ranking.map((row, idx) => {
        const isMe = row.user_id === currentUserId;
        const share = total > 0 ? (row.total_spent / total) * 100 : 0;
        const initials = row.full_name
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map((n) => n[0]?.toUpperCase())
          .join("");
        const MedalIcon = MEDAL_ICONS[idx];

        return (
          <div
            key={row.user_id}
            className={cn(
              "flex items-center gap-3 px-1 py-2.5",
              isMe && "rounded-md bg-accent px-2"
            )}
          >
            <span className="w-5 shrink-0 text-center text-sm font-semibold text-muted-foreground">
              {idx + 1}
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
            {MedalIcon && <MedalIcon className={cn("h-4 w-4 shrink-0", MEDAL_COLORS[idx])} />}
          </div>
        );
      })}
      {ranking.length === 0 && (
        <p className="py-6 text-center text-sm text-muted-foreground">Nenhum gasto registrado ainda.</p>
      )}
    </div>
  );
}
