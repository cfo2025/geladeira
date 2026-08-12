import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";

export function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
        <div>
          <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{formatCurrency(value)}</p>
        </div>
        <Button render={<Link href="/pagamento" />} nativeButton={false} size="sm">
          Pagar agora
        </Button>
      </CardContent>
    </Card>
  );
}
