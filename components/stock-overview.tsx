import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Refrigerator } from "lucide-react";

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
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {locations.map((loc) => {
        const items = inventory
          .filter((i) => i.location_id === loc.id)
          .sort((a, b) => a.product.name.localeCompare(b.product.name));
        const totalUnits = items.reduce((sum, i) => sum + i.quantity, 0);

        return (
          <Card key={loc.id}>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Refrigerator className="h-4 w-4 text-muted-foreground" />
                {loc.name}
              </CardTitle>
              <span className="text-xs text-muted-foreground">{totalUnits} un.</span>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {items.length === 0 && (
                <p className="text-xs text-muted-foreground">Sem produtos cadastrados.</p>
              )}
              {items.slice(0, 5).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="truncate text-muted-foreground">{item.product.name}</span>
                  {item.quantity <= 0 ? (
                    <Badge variant="destructive" className="shrink-0">
                      esgotado
                    </Badge>
                  ) : item.quantity <= 2 ? (
                    <Badge variant="secondary" className="shrink-0 text-amber-700 dark:text-amber-400">
                      {item.quantity} un.
                    </Badge>
                  ) : (
                    <span className="shrink-0 font-medium">{item.quantity} un.</span>
                  )}
                </div>
              ))}
              {items.length > 5 && (
                <p className="pt-1 text-xs text-muted-foreground">+{items.length - 5} outros itens</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
