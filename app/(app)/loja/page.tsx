import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { WithdrawForm } from "@/components/withdraw-form";
import { formatCurrency } from "@/lib/format";

export default async function LojaPage() {
  const supabase = await createClient();

  const [{ data: locations }, { data: inventory }] = await Promise.all([
    supabase.from("locations").select("id, name, description").order("name"),
    supabase
      .from("inventory")
      .select("id, price, quantity, location_id, product:products!inner(id, name, is_active)")
      .eq("product.is_active", true),
  ]);

  const inventoryByLocation = new Map<string, typeof inventory>();
  for (const item of inventory ?? []) {
    const list = inventoryByLocation.get(item.location_id) ?? [];
    list.push(item);
    inventoryByLocation.set(item.location_id, list);
  }

  if (!locations || locations.length === 0) {
    return <p className="text-muted-foreground">Nenhum local cadastrado ainda.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Loja</h1>
        <p className="text-muted-foreground">Escolha o local e retire seus itens.</p>
      </div>

      <Tabs defaultValue={locations[0].id}>
        <TabsList>
          {locations.map((loc) => (
            <TabsTrigger key={loc.id} value={loc.id}>
              {loc.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {locations.map((loc) => {
          const items = (inventoryByLocation.get(loc.id) ?? []).sort((a, b) =>
            a.product.name.localeCompare(b.product.name)
          );

          return (
            <TabsContent key={loc.id} value={loc.id} className="space-y-4">
              {loc.description && <p className="text-sm text-muted-foreground">{loc.description}</p>}

              {items.length === 0 ? (
                <p className="text-muted-foreground">Nenhum produto disponível neste local.</p>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((item) => (
                    <Card key={item.id}>
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center justify-between text-base">
                          {item.product.name}
                          {item.quantity <= 0 && <Badge variant="secondary">Esgotado</Badge>}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-baseline justify-between">
                          <span className="text-lg font-semibold">
                            {formatCurrency(item.price)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {item.quantity} em estoque
                          </span>
                        </div>
                        <WithdrawForm
                          productId={item.product.id}
                          locationId={loc.id}
                          maxQuantity={item.quantity}
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
