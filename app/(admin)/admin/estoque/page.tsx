import { createClient } from "@/lib/supabase/server";
import { CatalogTabs } from "@/components/admin/catalog-tabs";

export default async function AdminEstoquePage() {
  const supabase = await createClient();

  const [{ data: locations }, { data: products }, { data: inventory }] = await Promise.all([
    supabase.from("locations").select("id, name, description").order("name"),
    supabase
      .from("products")
      .select("id, name, category, image_url, is_active, price, promo_price")
      .order("name"),
    supabase.from("inventory").select("location_id, product_id, quantity"),
  ]);

  const stockByLocation: Record<string, number> = {};
  for (const item of inventory ?? []) {
    stockByLocation[item.location_id] = (stockByLocation[item.location_id] ?? 0) + item.quantity;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Estoque</h1>
        <p className="text-muted-foreground">
          Catálogo de produtos, preço único por item e estoque de cada geladeira.
        </p>
      </div>

      <CatalogTabs
        locations={locations ?? []}
        products={products ?? []}
        inventory={inventory ?? []}
        stockByLocation={stockByLocation}
      />
    </div>
  );
}
