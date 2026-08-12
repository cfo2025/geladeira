import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import type { MonthlyPoint } from "@/lib/extrato-analytics";

export function MonthlySpendingChart({ data }: { data: MonthlyPoint[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const hasData = data.some((d) => d.value > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Histórico Mensal de Gastos</CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="flex items-end gap-3">
            {data.map((d) => {
              const pct = Math.max(2, (d.value / max) * 100);
              return (
                <div key={d.key} className="group flex flex-1 flex-col items-center gap-2">
                  <div className="relative flex h-40 w-full items-end justify-center">
                    <div className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 rounded-md bg-foreground px-2 py-1 text-[11px] font-medium whitespace-nowrap text-background opacity-0 transition-opacity group-hover:opacity-100">
                      {formatCurrency(d.value)}
                    </div>
                    <div
                      className="w-full rounded-t-md bg-gold transition-[height]"
                      style={{ height: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground capitalize">{d.label}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="py-14 text-center text-sm text-muted-foreground">
            Sem dados suficientes para exibir o histórico.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
