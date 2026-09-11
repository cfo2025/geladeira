import { requireUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { KpiStrip, type KpiItem } from "@/components/kpi-strip";
import { ExpenseForm } from "@/components/transparencia/expense-form";
import { ProductPurchaseForm } from "@/components/transparencia/product-purchase-form";
import { ExpenseOutflowsTable } from "@/components/transparencia/expense-outflows-table";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { Wallet, HandCoins, BanknoteArrowDown, TrendingUp, PiggyBank, Construction } from "lucide-react";

export default async function TransparenciaPage() {
  const { profile } = await requireUser();

  const canManage = profile.role === "admin" || profile.role === "ordenador_despesa";

  // Ainda em produção pra usuário comum — só admin/ordenador de despesa vê a
  // tela de verdade por enquanto.
  if (!canManage) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transparência e fluxo de caixa</h1>
          <p className="text-muted-foreground">
            Saldo em caixa e prestação de contas de todas as saídas registradas na loja honesta.
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent">
              <Construction className="h-6 w-6 text-gold" />
            </span>
            <p className="font-semibold">Em produção</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Essa página ainda está sendo finalizada. Em breve todo mundo vai poder ver o saldo em
              caixa e o extrato de prestação de contas por aqui.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const supabase = await createClient();

  const [{ data: summaryRows }, { data: expenses }, { data: products }] = await Promise.all([
    supabase.rpc("get_transparency_summary"),
    supabase
      .from("expense_outflows")
      .select(
        "id, valor, data_hora, local_destinado, responsavel_retirada, observacoes, criado_por:profiles!expense_outflows_criado_por_id_fkey(full_name)"
      )
      .order("data_hora", { ascending: false }),
    supabase.from("products").select("id, name").eq("is_active", true).order("name"),
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

      <div>
        <h2 className="mb-3 text-lg font-bold">Lucro</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent">
                <TrendingUp className="h-5 w-5 text-gold" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  Lucro previsto
                </p>
                <p className="truncate text-xl font-bold">
                  {formatCurrency(Number(summary.projected_profit ?? 0))}
                </p>
                <p className="text-xs text-muted-foreground">
                  O que ainda está em estoque, aos preços e custos de hoje
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent">
                <PiggyBank className="h-5 w-5 text-gold" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  Lucro real
                </p>
                <p className="truncate text-xl font-bold">
                  {formatCurrency(Number(summary.realized_profit ?? 0))}
                </p>
                <p className="text-xs text-muted-foreground">Já efetivado nas vendas concluídas</p>
              </div>
            </CardContent>
          </Card>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Só entram nessa conta produtos que já tiveram compra registrada (ou custo definido em
          Estoque) — por isso o módulo começa zerado.
        </p>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-bold">Extrato de prestação de contas</h2>
        <ExpenseOutflowsTable expenses={expenses ?? []} />
      </div>
    </div>
  );
}
