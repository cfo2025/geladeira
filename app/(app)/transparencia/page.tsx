import { requireUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { KpiStrip, type KpiItem } from "@/components/kpi-strip";
import { ExpenseForm } from "@/components/transparencia/expense-form";
import { ProductPurchaseForm } from "@/components/transparencia/product-purchase-form";
import { ExpenseOutflowsTable } from "@/components/transparencia/expense-outflows-table";
import { formatCurrency } from "@/lib/format";
import { Wallet, HandCoins, BanknoteArrowDown, TrendingUp, PiggyBank } from "lucide-react";

const EXPENSE_SELECT =
  "id, valor, data_hora, local_destinado, responsavel_retirada, tag, observacoes, criado_por:profiles!expense_outflows_criado_por_id_fkey(full_name)";

export default async function TransparenciaPage() {
  const { profile } = await requireUser();
  const supabase = await createClient();

  const canManage = profile.role === "admin" || profile.role === "ordenador_despesa";

  // Usuário comum: só saldo/arrecadado (2 cards centralizados) e o extrato
  // de saídas — sem lançamentos, sem lucro previsto/real.
  if (!canManage) {
    const [{ data: summaryRows }, { data: expenses }] = await Promise.all([
      supabase.rpc("get_transparency_summary"),
      supabase.from("expense_outflows").select(EXPENSE_SELECT).order("data_hora", { ascending: false }),
    ]);

    const summary = summaryRows?.[0] ?? { available_balance: 0, total_collected: 0 };

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
    ];

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transparência e fluxo de caixa</h1>
          <p className="text-muted-foreground">
            Saldo em caixa e prestação de contas de todas as saídas registradas na loja honesta.
          </p>
        </div>

        <div className="mx-auto max-w-lg">
          <KpiStrip items={stats} />
        </div>

        <div>
          <h2 className="mb-3 text-lg font-bold">Extrato de prestação de contas</h2>
          <ExpenseOutflowsTable expenses={expenses ?? []} />
        </div>
      </div>
    );
  }

  const [{ data: summaryRows }, { data: expenses }, { data: products }] = await Promise.all([
    supabase.rpc("get_transparency_summary"),
    supabase.from("expense_outflows").select(EXPENSE_SELECT).order("data_hora", { ascending: false }),
    supabase
      .from("products")
      .select("id, name, category, image_url")
      .eq("is_active", true)
      .order("name"),
  ]);

  const summary = summaryRows?.[0] ?? {
    total_collected: 0,
    total_outflows: 0,
    available_balance: 0,
    projected_profit: 0,
    realized_profit: 0,
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
      label: "Lucro previsto",
      value: formatCurrency(Number(summary.projected_profit ?? 0)),
      icon: TrendingUp,
    },
    {
      label: "Lucro real",
      value: formatCurrency(Number(summary.realized_profit ?? 0)),
      icon: PiggyBank,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transparência e fluxo de caixa</h1>
          <p className="text-muted-foreground">
            Saldo em caixa e prestação de contas de todas as saídas registradas na loja honesta.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ProductPurchaseForm products={products ?? []} />
          <ExpenseForm availableBalance={Number(summary.available_balance ?? 0)} />
        </div>
      </div>

      <KpiStrip items={stats} />
      <p className="text-xs text-muted-foreground">
        O lucro só entra na conta pra produtos que já tiveram compra registrada (ou custo definido
        em Estoque) — por isso começa zerado. Previsto = o que está em estoque hoje; real = o que já
        foi vendido.
      </p>

      <div>
        <h2 className="mb-3 text-lg font-bold">Extrato de prestação de contas</h2>
        <ExpenseOutflowsTable expenses={expenses ?? []} />
      </div>
    </div>
  );
}
