import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { NewAuditForm } from "@/components/admin/new-audit-form";

export default async function NovoBalancoPage({
  searchParams,
}: {
  searchParams: Promise<{ location?: string }>;
}) {
  const { location } = await searchParams;
  const supabase = await createClient();

  const { data: locations } = await supabase.from("locations").select("id, name").order("name");
  const activeLocationId = location ?? locations?.[0]?.id;

  const { data: inventory } = activeLocationId
    ? await supabase
        .from("inventory")
        .select("quantity, product:products!inner(id, name)")
        .eq("location_id", activeLocationId)
    : { data: [] };

  const items = (inventory ?? [])
    .map((i) => ({
      productId: i.product.id,
      productName: i.product.name,
      expectedQuantity: i.quantity,
    }))
    .sort((a, b) => a.productName.localeCompare(b.productName));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Novo balanço de estoque</h1>
        <p className="text-muted-foreground">
          Informe a contagem física de cada produto. A diferença em relação ao estoque esperado
          será calculada automaticamente.
        </p>
      </div>

      <div className="flex gap-1">
        {(locations ?? []).map((loc) => (
          <Link
            key={loc.id}
            href={`/admin/auditoria/novo?location=${loc.id}`}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium",
              loc.id === activeLocationId
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            )}
          >
            {loc.name}
          </Link>
        ))}
      </div>

      {activeLocationId && <NewAuditForm locationId={activeLocationId} items={items} />}
    </div>
  );
}
