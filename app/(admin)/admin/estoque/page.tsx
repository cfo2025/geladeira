import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { InventoryRowForm } from "@/components/admin/inventory-row-form";

export default async function AdminEstoquePage() {
  const supabase = await createClient();

  const [{ data: locations }, { data: products }, { data: inventory }] = await Promise.all([
    supabase.from("locations").select("id, name").order("name"),
    supabase.from("products").select("id, name, is_active").order("name"),
    supabase.from("inventory").select("location_id, product_id, price, quantity"),
  ]);

  if (!locations || locations.length === 0) {
    return <p className="text-muted-foreground">Nenhum local cadastrado.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Estoque</h1>
        <p className="text-muted-foreground">Defina o preço e a quantidade de cada produto por local.</p>
      </div>

      <Tabs defaultValue={locations[0].id}>
        <TabsList>
          {locations.map((loc) => (
            <TabsTrigger key={loc.id} value={loc.id}>
              {loc.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {locations.map((loc) => (
          <TabsContent key={loc.id} value={loc.id}>
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Ajustar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(products ?? []).map((product) => {
                      const inv = (inventory ?? []).find(
                        (i) => i.location_id === loc.id && i.product_id === product.id
                      );
                      return (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">
                            {product.name}
                            {!product.is_active && (
                              <Badge variant="secondary" className="ml-2">
                                inativo
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <InventoryRowForm
                              locationId={loc.id}
                              productId={product.id}
                              price={inv?.price ?? null}
                              quantity={inv?.quantity ?? null}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {(!products || products.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground">
                          Nenhum produto cadastrado.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
