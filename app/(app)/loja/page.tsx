import { createClient } from "@/lib/supabase/server";
import { LojaBrowser } from "@/components/loja/loja-browser";

export default async function LojaPage() {
  const supabase = await createClient();

  const [{ data: locations }, { data: inventory }] = await Promise.all([
    supabase.from("locations").select("id, name").order("name"),
    supabase
      .from("inventory")
      .select(
        "id, price, quantity, location_id, product:products!inner(id, name, category, image_url, is_active)"
      )
      .eq("product.is_active", true),
  ]);

  if (!locations || locations.length === 0) {
    return <p className="text-muted-foreground">Nenhum local cadastrado ainda.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Loja</h1>
        <p className="text-muted-foreground">Escolha o local e retire seus itens.</p>
      </div>

      <LojaBrowser locations={locations} inventory={inventory ?? []} />
    </div>
  );
}
