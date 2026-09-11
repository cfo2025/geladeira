import { createClient } from "@/lib/supabase/server";
import { CatalogTabs } from "@/components/admin/catalog-tabs";

export default async function AdminEstoquePage() {
  const supabase = await createClient();

  const [{ data: locations }, { data: products }, { data: inventory }, { data: withdrawalLocations }, { data: auditLocations }] =
    await Promise.all([
      supabase.from("locations").select("id, name, description, is_active").order("name"),
      supabase
        .from("products")
        .select("id, name, category, image_url, is_active, price, promo_price, cost_price")
        .order("name"),
      supabase.from("inventory").select("location_id, product_id, quantity"),
      supabase.from("withdrawals").select("location_id").not("location_id", "is", null),
      supabase.from("stock_audits").select("location_id"),
    ]);

  const stockByLocation: Record<string, number> = {};
  for (const item of inventory ?? []) {
    stockByLocation[item.location_id] = (stockByLocation[item.location_id] ?? 0) + item.quantity;
  }

  const hasHistory: Record<string, boolean> = {};
  for (const w of withdrawalLocations ?? []) {
    if (w.location_id) hasHistory[w.location_id] = true;
  }
  for (const a of auditLocations ?? []) {
    if (a.location_id) hasHistory[a.location_id] = true;
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
        hasHistory={hasHistory}
      />
    </div>
  );
}
