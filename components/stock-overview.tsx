import { Card, CardContent } from "@/components/ui/card";
import { ProgressRing } from "@/components/ui/progress-ring";

type InventoryItem = {
  location_id: string;
  quantity: number;
  product: { name: string };
};

export function StockOverview({
  locations,
  inventory,
}: {
  locations: { id: string; name: string }[];
  inventory: InventoryItem[];
}) {
  const totalsByLocation = locations.map((loc) => ({
    ...loc,
    total: inventory.filter((i) => i.location_id === loc.id).reduce((sum, i) => sum + i.quantity, 0),
  }));
  const maxTotal = Math.max(1, ...totalsByLocation.map((l) => l.total));

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {totalsByLocation.map((loc) => (
        <Card key={loc.id} size="sm">
          <CardContent className="flex flex-col items-center gap-2 pt-4 text-center">
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              {loc.name}
            </p>
            <ProgressRing percent={(loc.total / maxTotal) * 100} size={76} strokeWidth={7}>
              <div className="flex flex-col items-center">
                <span className="text-lg font-bold tabular-nums">{loc.total}</span>
                <span className="text-[9px] font-medium tracking-wide text-muted-foreground uppercase">
                  itens
                </span>
              </div>
            </ProgressRing>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
