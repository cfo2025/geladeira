import { requireUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { SummaryCard } from "@/components/extrato/summary-card";
import { ExtratoTable } from "@/components/extrato/extrato-table";
import { MonthlySpendingChart } from "@/components/extrato/monthly-spending-chart";
import { LocationDistributionChart } from "@/components/extrato/location-distribution-chart";
import { buildMonthlyHistory, buildLocationDistribution } from "@/lib/extrato-analytics";

export default async function ExtratoPage() {
  const { userId } = await requireUser();
  const supabase = await createClient();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [{ data: balance }, { data: withdrawals }, { data: locations }] = await Promise.all([
    supabase.rpc("get_my_balance"),
    supabase
      .from("withdrawals")
      .select(
        "id, quantity, unit_price_at_withdrawal, status, created_at, product:products(name, image_url), location:locations(id, name)"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase.from("locations").select("id, name").order("name"),
  ]);

  const nonCancelled = (withdrawals ?? []).filter((w) => w.status !== "cancelled");
  const monthDebt = nonCancelled
    .filter((w) => new Date(w.created_at) >= startOfMonth)
    .reduce((sum, w) => sum + w.unit_price_at_withdrawal * w.quantity, 0);

  const monthlyHistory = buildMonthlyHistory(nonCancelled);
  const locationDistribution = buildLocationDistribution(nonCancelled);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Extrato</h1>
        <p className="text-muted-foreground">Suas retiradas, saldo e histórico de consumo.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SummaryCard label="Saldo total em aberto" value={Number(balance ?? 0)} />
        <SummaryCard label="Débito acumulado do mês" value={monthDebt} />
      </div>

      <ExtratoTable withdrawals={withdrawals ?? []} locations={locations ?? []} />

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <MonthlySpendingChart data={monthlyHistory} />
        <LocationDistributionChart data={locationDistribution} />
      </div>
    </div>
  );
}
