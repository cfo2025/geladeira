import Link from "next/link";
import { requireUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QuickWithdrawDialog } from "@/components/quick-withdraw-dialog";
import { StockOverview } from "@/components/stock-overview";
import { SpendingRanking } from "@/components/spending-ranking";
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
      .select("id, location_id, price, quantity, product:products!inner(id, name, is_active)")
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

  const stats = [
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
      label: "Retiradas este mês",
      value: String(monthWithdrawals),
      icon: Receipt,
    },
    {
      label: "Posição no ranking",
      value: myPosition > 0 ? `${myPosition}º de ${rankingRows.length}` : "—",
      icon: Trophy,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Olá, {profile.full_name.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground">Aqui está o resumo da sua conta na Loja Honesta.</p>
        </div>
        <QuickWithdrawDialog locations={locations ?? []} inventory={inventory ?? []} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center justify-between pt-6">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="mt-1 font-heading text-xl font-semibold">{stat.value}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
                <stat.icon className="h-5 w-5 text-gold" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {Number(balance ?? 0) > 0 && (
        <Card className="border-gold/30 bg-gold/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
            <p className="text-sm">
              Você tem <span className="font-semibold">{formatCurrency(Number(balance ?? 0))}</span> em
              aberto. Que tal regularizar via Pix?
            </p>
            <Button render={<Link href="/pagamento" />} size="sm" variant="outline">
              Ir para pagamento
            </Button>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="mb-3 font-heading text-lg font-semibold">Estoque das geladeiras</h2>
        <StockOverview locations={locations ?? []} inventory={inventory ?? []} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Ranking de gastos da turma</CardTitle>
        </CardHeader>
        <CardContent>
          <SpendingRanking ranking={rankingRows} currentUserId={userId} />
        </CardContent>
      </Card>
    </div>
  );
}
