import { requireUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { KpiStrip, type KpiItem } from "@/components/kpi-strip";
import { ExpenseForm } from "@/components/transparencia/expense-form";
import { ExpenseOutflowsTable } from "@/components/transparencia/expense-outflows-table";
import { formatCurrency } from "@/lib/format";
import { Wallet, HandCoins, BanknoteArrowDown, TrendingUp } from "lucide-react";

export default async function TransparenciaPage() {
  const { profile } = await requireUser();
  const supabase = await createClient();

  const canManage = profile.role === "admin" || profile.role === "ordenador_despesa";

  const [{ data: summaryRows }, { data: expenses }] = await Promise.all([
    supabase.rpc("get_transparency_summary"),
    supabase
      .from("expense_outflows")
      .select(
        "id, valor, data_hora, local_destinado, responsavel_retirada, observacoes, criado_por:profiles!expense_outflows_criado_por_id_fkey(full_name)"
      )
      .order("data_hora", { ascending: false }),
  ]);

  const summary = summaryRows?.[0] ?? {
    total_collected: 0,
    total_outflows: 0,
    available_balance: 0,
    estimated_profit: 0,
  };

  const stats: KpiItem[] = [
    {
      label: "Saldo em caixa disponível",
      value: formatCurrency(Number(summary.available_balance ?? 0)),
      icon: Wallet,
    },
    {
      label: "Total arrecadado",
      value: formatCurrency(Number(summary.total_collected ?? 0)),
      icon: HandCoins,
    },
    {
      label: "Total investido / gasto",
      value: formatCurrency(Number(summary.total_outflows ?? 0)),
      icon: BanknoteArrowDown,
    },
    {
      label: "Lucro acumulado estimado",
      value: formatCurrency(Number(summary.estimated_profit ?? 0)),
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Transparência e fluxo de caixa</h1>
        <p className="text-muted-foreground">
          Saldo em caixa e prestação de contas de todas as saídas registradas na loja honesta.
        </p>
      </div>

      <KpiStrip items={stats} />

      {canManage && <ExpenseForm availableBalance={Number(summary.available_balance ?? 0)} />}

      <div>
        <h2 className="mb-3 text-lg font-bold">Extrato de prestação de contas</h2>
        <ExpenseOutflowsTable expenses={expenses ?? []} />
      </div>
    </div>
  );
}
