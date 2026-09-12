import { requireUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { KpiStrip, type KpiItem } from "@/components/kpi-strip";
import { ExpenseForm } from "@/components/transparencia/expense-form";
import { ProductPurchaseForm } from "@/components/transparencia/product-purchase-form";
import { ExpenseOutflowsTable } from "@/components/transparencia/expense-outflows-table";
import { CashLedgerTable } from "@/components/transparencia/cash-ledger-table";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { Wallet, HandCoins, BanknoteArrowDown, PiggyBank, Construction, Eye } from "lucide-react";

const EXPENSE_SELECT =
  "id, valor, data_hora, local_destinado, responsavel_retirada, tag, observacoes, criado_por:profiles!expense_outflows_criado_por_id_fkey(full_name)";

export default async function TransparenciaPage({
  searchParams,
}: {
  searchParams: Promise<{ visao?: string }>;
}) {
  const { profile } = await requireUser();

  const canManage = profile.role === "admin" || profile.role === "ordenador_despesa";

  // Ainda em produção pra usuário comum — só admin/ordenador de despesa vê a
  // tela de verdade por enquanto (que pode incluir a pré-visualização de
  // como vai ficar pro usuário, via ?visao=usuario — ver abaixo).
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
  const { visao } = await searchParams;

  // Pré-visualização de como a página vai ficar pro usuário comum quando for
  // liberada — só admin/ordenador acessam isso, via ?visao=usuario. Serve
  // pra aprovar antes de trocar o "Em produção" acima pelo conteúdo de
  // verdade.
  if (visao === "usuario") {
    const [{ data: summaryRows }, { data: expenses }] = await Promise.all([
      supabase.rpc("get_transparency_summary"),
      supabase.from("expense_outflows").select(EXPENSE_SELECT).order("data_hora", { ascending: false }),
    ]);

    const summary = summaryRows?.[0] ?? { available_balance: 0, total_collected: 0, total_outflows: 0 };

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
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-gold/40 bg-gold/5 px-3 py-2 text-xs text-muted-foreground">
          <Eye className="h-3.5 w-3.5 shrink-0 text-gold" />
          Pré-visualização: é assim que um usuário comum vai ver essa página quando for liberada.
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transparência e fluxo de caixa</h1>
          <p className="text-muted-foreground">
            Saldo em caixa e prestação de contas de todas as saídas registradas na loja honesta.
          </p>
        </div>

        <KpiStrip items={stats} />

        <div>
          <h2 className="mb-3 text-lg font-bold">Extrato de saídas</h2>
          <ExpenseOutflowsTable expenses={expenses ?? []} />
        </div>
      </div>
    );
  }

  const [{ data: summaryRows }, { data: expenses }, { data: products }, { data: payments }] =
    await Promise.all([
      supabase.rpc("get_transparency_summary"),
      supabase.from("expense_outflows").select(EXPENSE_SELECT).order("data_hora", { ascending: false }),
      supabase
        .from("products")
        .select("id, name, category, image_url, price, promo_price")
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("payments")
        .select("id, admin_typed_amount, reviewed_at, user:profiles!payments_user_id_fkey(full_name)")
        .eq("status", "approved")
        .order("reviewed_at", { ascending: false }),
    ]);

  const summary = summaryRows?.[0] ?? {
    total_collected: 0,
    total_outflows: 0,
    available_balance: 0,
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

      <div>
        <h2 className="mb-3 text-lg font-bold">Extrato de entradas e saídas</h2>
        <CashLedgerTable expenses={expenses ?? []} payments={payments ?? []} />
      </div>
    </div>
  );
}
