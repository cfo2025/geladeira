import { createClient } from "@/lib/supabase/server";
import { PendingCancellationsCard } from "@/components/admin/pending-cancellations-card";
import { NewAuditDialog } from "@/components/admin/new-audit-dialog";
import { DivergencesTable } from "@/components/admin/divergences-table";
import { WithdrawalsHistoryTable } from "@/components/admin/withdrawals-history-table";

export default async function AdminRetiradasPage() {
  const supabase = await createClient();

  const [
    { data: requests },
    { data: withdrawals },
    { data: locations },
    { data: inventory },
    { data: auditItems },
  ] = await Promise.all([
    supabase
      .from("withdrawal_cancellation_requests")
      .select(
        "id, reason, status, created_at, profile:profiles!withdrawal_cancellation_requests_user_id_fkey(full_name), withdrawal:withdrawals(quantity, unit_price_at_withdrawal, product:products(name))"
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("withdrawals")
      .select(
        "id, quantity, unit_price_at_withdrawal, status, created_at, profile:profiles(full_name), product:products(name), location:locations(name)"
      )
      .order("created_at", { ascending: false })
      .limit(500),
    supabase.from("locations").select("id, name").order("name"),
    supabase
      .from("inventory")
      .select("location_id, quantity, product:products!inner(id, name, is_active)")
      .eq("product.is_active", true),
    supabase
      .from("stock_audit_items")
      .select(
        "id, audit_id, expected_quantity, physical_quantity, difference, applied_at, product:products(name), audit:stock_audits(created_at, location:locations(name))"
      )
      .neq("difference", 0)
      .order("id", { ascending: false }),
  ]);

  const pendingRequests = (requests ?? []).filter((r) => r.status === "pending");

  const inventoryItems = (inventory ?? []).map((i) => ({
    location_id: i.location_id,
    product_id: i.product.id,
    product_name: i.product.name,
    quantity: i.quantity,
  }));

  const divergences = (auditItems ?? [])
    .map((item) => ({
      id: item.id,
      audit_id: item.audit_id,
      created_at: item.audit?.created_at ?? "",
      location_name: item.audit?.location?.name ?? "—",
      product_name: item.product?.name ?? "—",
      expected_quantity: item.expected_quantity,
      physical_quantity: item.physical_quantity,
      difference: item.difference,
      applied_at: item.applied_at,
    }))
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Retiradas</h1>
        <p className="text-muted-foreground">
          Auditoria de estoque, cancelamentos e histórico de retiradas.
        </p>
      </div>

      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Divergências de balanço
            </h2>
            <NewAuditDialog locations={locations ?? []} inventory={inventoryItems} />
          </div>
          <DivergencesTable divergences={divergences} locations={locations ?? []} />
        </div>

        <div className="w-full shrink-0 md:w-80 lg:w-96">
          <PendingCancellationsCard requests={pendingRequests} />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Histórico geral de retiradas
        </h2>
        <WithdrawalsHistoryTable withdrawals={withdrawals ?? []} locations={locations ?? []} />
      </div>
    </div>
  );
}
