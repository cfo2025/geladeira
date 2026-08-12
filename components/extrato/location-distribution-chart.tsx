import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import type { LocationSlice } from "@/lib/extrato-analytics";

const SLOT_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];

export function LocationDistributionChart({ data }: { data: LocationSlice[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  type Stop = LocationSlice & { start: number; end: number; cumulative: number; color: string };
  const stops = data.reduce<Stop[]>((acc, d, i) => {
    const prevCumulative = acc.length > 0 ? acc[acc.length - 1].cumulative : 0;
    const cumulative = prevCumulative + d.value;
    const start = total > 0 ? (prevCumulative / total) * 100 : 0;
    const end = total > 0 ? (cumulative / total) * 100 : 0;
    acc.push({ ...d, start, end, cumulative, color: SLOT_COLORS[i] ?? SLOT_COLORS[3] });
    return acc;
  }, []);

  const gradient =
    total > 0
      ? stops.map((s) => `${s.color} ${s.start}% ${s.end}%`).join(", ")
      : "var(--muted) 0% 100%";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Distribuição de Retiradas por Local</CardTitle>
      </CardHeader>
      <CardContent>
        {total > 0 ? (
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <div
              className="relative h-40 w-40 shrink-0 rounded-full"
              style={{ background: `conic-gradient(${gradient})` }}
            >
              <div className="absolute inset-3 flex flex-col items-center justify-center rounded-full bg-card text-center">
                <span className="text-base font-bold tabular-nums">{formatCurrency(total)}</span>
                <span className="text-[10px] tracking-wide text-muted-foreground uppercase">Total</span>
              </div>
            </div>
            <ul className="w-full min-w-0 space-y-2.5">
              {stops.map((s) => (
                <li key={s.id} className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
                  <span className="flex-1 truncate">{s.name}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {total > 0 ? ((s.value / total) * 100).toFixed(0) : 0}%
                  </span>
                  <span className="w-20 shrink-0 text-right font-medium tabular-nums">
                    {formatCurrency(s.value)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="py-14 text-center text-sm text-muted-foreground">
            Sem retiradas registradas ainda.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
