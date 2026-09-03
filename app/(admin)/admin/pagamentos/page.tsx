import { createClient } from "@/lib/supabase/server";
import { PendingPaymentsCard } from "@/components/admin/pending-payments-card";
import { PaymentsHistoryTable } from "@/components/admin/payments-history-table";

export default async function AdminPagamentosPage() {
  const supabase = await createClient();
  const { data: payments } = await supabase
    .from("payments")
    .select(
      "*, profile:profiles!payments_user_id_fkey(full_name), reviewer:profiles!payments_reviewed_by_fkey(full_name)"
    )
    .order("created_at", { ascending: false });

  const pending = (payments ?? []).filter((p) => p.status === "pending");
  const reviewed = (payments ?? []).filter((p) => p.status !== "pending");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pagamentos</h1>
        <p className="text-muted-foreground">Confira os pagamentos Pix declarados pelos usuários.</p>
      </div>

      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        <div className="min-w-0 flex-1 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Histórico
          </h2>
          <PaymentsHistoryTable payments={reviewed} />
        </div>

        <div className="w-full shrink-0 md:w-80 lg:w-96">
          <PendingPaymentsCard payments={pending} />
        </div>
      </div>
    </div>
  );
}
