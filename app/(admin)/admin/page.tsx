import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [
    { count: pendingPayments },
    { count: pendingCancellations },
    { count: activeUsers },
    { data: totalOwedResult },
  ] = await Promise.all([
    supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase
      .from("withdrawal_cancellation_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.rpc("get_total_open_balance"),
  ]);

  const totalOwed = Number(totalOwedResult ?? 0);

  const cards = [
    {
      label: "Pagamentos pendentes",
      value: pendingPayments ?? 0,
      href: "/admin/pagamentos",
    },
    {
      label: "Cancelamentos pendentes",
      value: pendingCancellations ?? 0,
      href: "/admin/retiradas",
    },
    {
      label: "Usuários ativos",
      value: activeUsers ?? 0,
      href: "/admin/usuarios",
    },
    {
      label: "Saldo em aberto (todos)",
      value: formatCurrency(totalOwed),
      href: "/admin/pagamentos",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Painel</h1>
        <p className="text-muted-foreground">Visão geral da Loja Honesta.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.label} href={card.href}>
            <Card className="transition-colors hover:bg-muted/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-normal text-muted-foreground">
                  {card.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-2xl font-bold">{card.value}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
