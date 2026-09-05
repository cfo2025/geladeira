import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ComparativeStats } from "@/lib/extrato-analytics";

export function ComparisonCard({ stats }: { stats: ComparativeStats }) {
  const { variationPct, topItem, itemsCountThisMonth, topLocation } = stats;

  const TrendIcon = variationPct == null || variationPct === 0 ? Minus : variationPct > 0 ? TrendingUp : TrendingDown;
  const trendClass =
    variationPct == null || variationPct === 0
      ? "text-muted-foreground"
      : variationPct > 0
        ? "text-destructive"
        : "text-green-600 dark:text-green-400";

  return (
    <Card size="sm">
      <CardContent className="space-y-2.5 pt-4">
        <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
          Comparado ao mês anterior
        </p>

        <div className="flex items-center gap-1.5">
          <TrendIcon className={cn("h-4 w-4 shrink-0", trendClass)} />
          <span className={cn("text-xl font-bold tabular-nums", trendClass)}>
            {variationPct == null ? "—" : `${variationPct > 0 ? "+" : ""}${variationPct.toFixed(0)}%`}
          </span>
          <span className="text-xs text-muted-foreground">de variação nos gastos</span>
        </div>

        <div className="space-y-1 border-t pt-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Item mais consumido (mês)</span>
            <span className="font-medium">
              {topItem ? `${topItem.name} (${topItem.quantity}x)` : "—"}
            </span>
          </div>
          {topItem?.category && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Categoria</span>
              <span className="font-medium">{topItem.category}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Itens retirados no mês</span>
            <span className="font-medium tabular-nums">{itemsCountThisMonth}</span>
          </div>
          {topLocation && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Geladeira mais usada</span>
              <span className="font-medium">{topLocation.name}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
