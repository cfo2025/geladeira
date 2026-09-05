import { requireUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { SummaryCard } from "@/components/extrato/summary-card";
import { ComparisonCard } from "@/components/extrato/comparison-card";
import { ExtratoTable } from "@/components/extrato/extrato-table";
import { MonthlySpendingChart } from "@/components/extrato/monthly-spending-chart";
import { LocationDistributionChart } from "@/components/extrato/location-distribution-chart";
import {
  buildMonthlyHistory,
  buildLocationDistribution,
  buildComparativeStats,
} from "@/lib/extrato-analytics";

export default async function ExtratoPage() {
  const { userId } = await requireUser();
  const supabase = await createClient();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [{ data: balance }, { data: withdrawals }, { data: payments }, { data: locations }] =
    await Promise.all([
      supabase.rpc("get_my_balance"),
      supabase
        .from("withdrawals")
        .select(
          "id, quantity, unit_price_at_withdrawal, status, created_at, payment_id, product:products(name, category, image_url), location:locations(id, name)"
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("payments")
        .select("id, status, created_at, user_declared_amount, admin_typed_amount")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase.from("locations").select("id, name").order("name"),
    ]);

  const nonCancelled = (withdrawals ?? []).filter((w) => w.status !== "cancelled");

  const totalSpentAllTime = nonCancelled.reduce(
    (sum, w) => sum + w.unit_price_at_withdrawal * w.quantity,
    0
  );
  const totalPaidAllTime = (payments ?? [])
    .filter((p) => p.status === "approved")
    .reduce((sum, p) => sum + (p.admin_typed_amount ?? p.user_declared_amount), 0);

  const monthWithdrawals = nonCancelled.filter((w) => new Date(w.created_at) >= startOfMonth);
  const spentThisMonth = monthWithdrawals.reduce(
    (sum, w) => sum + w.unit_price_at_withdrawal * w.quantity,
    0
  );
  // "pago esse mês" é sobre o consumo DESTE mês já ter sido quitado — não sobre
  // quando o pagamento foi declarado. Um pagamento feito hoje pode ter ido
  // inteiro pra dívida do mês passado (quita sempre o mais antigo primeiro),
  // então olhamos o payment_id de cada retirada do mês, não a data do pagamento.
  const paidThisMonth = monthWithdrawals
    .filter((w) => w.payment_id !== null)
    .reduce((sum, w) => sum + w.unit_price_at_withdrawal * w.quantity, 0);

  const monthlyHistory = buildMonthlyHistory(nonCancelled);
  const locationDistribution = buildLocationDistribution(nonCancelled);
  const comparativeStats = buildComparativeStats(nonCancelled);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Extrato</h1>
        <p className="text-muted-foreground">Suas retiradas, saldo e histórico de consumo.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard
          label="Saldo total em aberto"
          value={Number(balance ?? 0)}
          subLines={[
            { label: "Gasto total já feito", value: totalSpentAllTime },
            { label: "Total já pago", value: totalPaidAllTime },
          ]}
        />
        <SummaryCard
          label="Saldo do mês"
          value={spentThisMonth - paidThisMonth}
          showPayButton={false}
          subLines={[
            { label: "Total do mês atual", value: spentThisMonth },
            { label: "Já pago esse mês", value: paidThisMonth },
          ]}
        />
        <ComparisonCard stats={comparativeStats} />
      </div>

      <ExtratoTable withdrawals={withdrawals ?? []} payments={payments ?? []} locations={locations ?? []} />

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <MonthlySpendingChart data={monthlyHistory} />
        <LocationDistributionChart data={locationDistribution} />
      </div>
    </div>
  );
}
