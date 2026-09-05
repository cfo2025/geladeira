import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";

export function SummaryCard({
  label,
  value,
  subLines,
  showPayButton = true,
}: {
  label: string;
  value: number;
  subLines?: { label: string; value: number }[];
  showPayButton?: boolean;
}) {
  return (
    <Card size="sm">
      <CardContent className="space-y-2 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              {label}
            </p>
            <p className="mt-0.5 text-xl font-bold tabular-nums">{formatCurrency(value)}</p>
          </div>
          {showPayButton && (
            <Button render={<Link href="/pagamento" />} nativeButton={false} size="sm">
              Pagar agora
            </Button>
          )}
        </div>
        {subLines && subLines.length > 0 && (
          <div className="space-y-0.5 border-t pt-2">
            {subLines.map((line) => (
              <div key={line.label} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{line.label}</span>
                <span className="font-medium tabular-nums">{formatCurrency(line.value)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
