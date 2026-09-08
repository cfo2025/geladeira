import { createClient } from "@/lib/supabase/server";
import { PagamentosTabs } from "@/components/admin/pagamentos-tabs";

export default async function AdminPagamentosPage() {
  const supabase = await createClient();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const startOfLastMonth = new Date(startOfMonth);
  startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);

  const [{ data: payments }, { data: debtors }] = await Promise.all([
    supabase
      .from("payments")
      .select(
        "*, profile:profiles!payments_user_id_fkey(full_name), reviewer:profiles!payments_reviewed_by_fkey(full_name)"
      )
      .order("created_at", { ascending: false }),
    supabase.rpc("get_admin_debtor_summary"),
  ]);

  const pending = (payments ?? []).filter((p) => p.status === "pending");
  const reviewed = (payments ?? []).filter((p) => p.status !== "pending");
  const approved = (payments ?? []).filter((p) => p.status === "approved");

  const pendingTotal = pending.reduce((sum, p) => sum + p.user_declared_amount, 0);
  const paidAllTime = approved.reduce((sum, p) => sum + (p.admin_typed_amount ?? 0), 0);
  const paidThisMonth = approved
    .filter((p) => new Date(p.created_at) >= startOfMonth)
    .reduce((sum, p) => sum + (p.admin_typed_amount ?? 0), 0);
  const paidLastMonth = approved
    .filter((p) => new Date(p.created_at) >= startOfLastMonth && new Date(p.created_at) < startOfMonth)
    .reduce((sum, p) => sum + (p.admin_typed_amount ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pagamentos</h1>
        <p className="text-muted-foreground">
          Acompanhe quanto cada um deve e confira os pagamentos Pix declarados.
        </p>
      </div>

      <PagamentosTabs
        debtors={debtors ?? []}
        pendingTotal={pendingTotal}
        paidLastMonth={paidLastMonth}
        paidThisMonth={paidThisMonth}
        paidAllTime={paidAllTime}
        pending={pending}
        reviewed={reviewed}
      />
    </div>
  );
}
