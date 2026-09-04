import Link from "next/link";
import { requireUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QuickWithdrawDialog } from "@/components/quick-withdraw-dialog";
import { StockOverview } from "@/components/stock-overview";
import { SpendingRanking } from "@/components/spending-ranking";
import { KpiStrip, type KpiItem } from "@/components/kpi-strip";
import { formatCurrency } from "@/lib/format";
import { Wallet, TrendingUp, Trophy, Receipt } from "lucide-react";

export default async function DashboardPage() {
  const { userId, profile } = await requireUser();
  const supabase = await createClient();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    { data: balance },
    { data: myWithdrawals },
    { data: locations },
    { data: inventory },
    { data: ranking },
  ] = await Promise.all([
    supabase.rpc("get_my_balance"),
    supabase
      .from("withdrawals")
      .select("unit_price_at_withdrawal, quantity, status, created_at")
      .eq("user_id", userId),
    supabase.from("locations").select("id, name").order("name"),
    supabase
      .from("inventory")
      .select(
        "id, location_id, quantity, product:products!inner(id, name, category, image_url, is_active, price, promo_price)"
      )
      .eq("product.is_active", true),
    supabase.rpc("get_spending_ranking"),
  ]);

  const totalSpent = (myWithdrawals ?? [])
    .filter((w) => w.status !== "cancelled")
    .reduce((sum, w) => sum + w.unit_price_at_withdrawal * w.quantity, 0);

  const monthWithdrawals = (myWithdrawals ?? []).filter(
    (w) => w.status !== "cancelled" && new Date(w.created_at) >= startOfMonth
  ).length;

  const rankingRows = ranking ?? [];
  const myPosition = rankingRows.findIndex((r) => r.user_id === userId) + 1;

  const stats: KpiItem[] = [
    {
      label: "Saldo em aberto",
      value: formatCurrency(Number(balance ?? 0)),
      icon: Wallet,
    },
    {
      label: "Total gasto (histórico)",
      value: formatCurrency(totalSpent),
      icon: TrendingUp,
    },
    {
      label: "Retiradas (mês)",
      value: String(monthWithdrawals),
      icon: Receipt,
    },
    {
      label: "Ranking (turma)",
      value: myPosition > 0 ? `${myPosition}º de ${rankingRows.length}` : "—",
      icon: Trophy,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Olá, {profile.full_name.split(" ")[0]}! 👋</h1>
        <p className="text-muted-foreground">Aqui está o resumo do seu uso das geladeiras.</p>
      </div>

      <KpiStrip items={stats} />

      <QuickWithdrawDialog
        locations={locations ?? []}
        inventory={inventory ?? []}
        size="lg"
        className="w-full sm:hidden"
      />

      {Number(balance ?? 0) > 0 && (
        <Card className="border-gold/30 bg-gold/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
            <p className="text-sm">
              Você tem <span className="font-semibold">{formatCurrency(Number(balance ?? 0))}</span> em
              aberto. Que tal regularizar via Pix?
            </p>
            <Button render={<Link href="/pagamento" />} nativeButton={false} size="sm" variant="outline">
              Ir para pagamento
            </Button>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="mb-3 text-lg font-bold">Estoque das geladeiras</h2>
        <StockOverview locations={locations ?? []} inventory={inventory ?? []} />
      </div>

      <SpendingRanking ranking={rankingRows} currentUserId={userId} />
    </div>
  );
}
