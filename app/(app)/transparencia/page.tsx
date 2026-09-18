import { requireUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { KpiStrip, type KpiItem } from "@/components/kpi-strip";
import { ExpenseForm } from "@/components/transparencia/expense-form";
import { ProductPurchaseForm } from "@/components/transparencia/product-purchase-form";
import { ExpenseOutflowsTable } from "@/components/transparencia/expense-outflows-table";
import { CashLedgerTable } from "@/components/transparencia/cash-ledger-table";
import { formatCurrency } from "@/lib/format";
import { Wallet, BanknoteArrowDown, PiggyBank, Eye } from "lucide-react";

const EXPENSE_SELECT =
  "id, valor, data_hora, local_destinado, responsavel_retirada, tag, observacoes, criado_por:profiles!expense_outflows_criado_por_id_fkey(full_name)";

export default async function TransparenciaPage({
  searchParams,
}: {
  searchParams: Promise<{ visao?: string }>;
}) {
  const { profile } = await requireUser();

  const canManage = profile.role === "admin" || profile.role === "ordenador_despesa";

  const supabase = await createClient();
  const { visao } = await searchParams;

  // Usuário comum vê só saldo + extrato de saídas (somente leitura). Admin/
  // ordenador de despesa veem a tela completa, mas podem pré-visualizar essa
  // mesma visão de usuário via ?visao=usuario.
  if (!canManage || visao === "usuario") {
    const [{ data: summaryRows }, { data: expensesRaw }] = await Promise.all([
      supabase.rpc("get_transparency_summary"),
      supabase
        .from("expense_outflows")
        .select("id, valor, data_hora, local_destinado, responsavel_retirada, tag, observacoes, criado_por_id")
        .order("data_hora", { ascending: false }),
    ]);

    // O RLS de profiles só deixa usuário comum ler o próprio perfil, então o
    // nome de quem homologou (criado_por) é resolvido aqui no servidor com
    // service role — só id -> full_name de quem lançou despesa.
    const creatorIds = [...new Set((expensesRaw ?? []).map((e) => e.criado_por_id))];
    const { data: creators } =
      creatorIds.length > 0
        ? await createAdminClient().from("profiles").select("id, full_name").in("id", creatorIds)
        : { data: [] };
    const nameById = new Map((creators ?? []).map((c) => [c.id, c.full_name]));
    const expenses = (expensesRaw ?? []).map(({ criado_por_id, ...e }) => {
      const name = nameById.get(criado_por_id);
      return { ...e, criado_por: name ? { full_name: name } : null };
    });

    const summary = summaryRows?.[0] ?? { available_balance: 0, total_empenhado: 0, projected_profit: null };

    const stats: KpiItem[] = [
      {
        label: "Saldo em Caixa Disponível",
        value: formatCurrency(Number(summary.available_balance ?? 0)),
        icon: Wallet,
      },
      {
        label: "Total Gasto/Empenhado",
        value: formatCurrency(Number(summary.total_empenhado ?? 0)),
        icon: BanknoteArrowDown,
      },
    ];

    return (
      <div className="space-y-6">
        {canManage && (
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-gold/40 bg-gold/5 px-3 py-2 text-xs text-muted-foreground">
            <Eye className="h-3.5 w-3.5 shrink-0 text-gold" />
            Pré-visualização: é assim que um usuário comum vê essa página.
          </div>
        )}
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

  const [{ data: summaryRows }, { data: expenses }, { data: products }, { data: payments }, { data: purchases }] =
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
      supabase
        .from("product_purchases")
        .select(
          "id, quantity, unit_cost, data_hora, observacoes, product:products(name), criado_por:profiles!product_purchases_criado_por_id_fkey(full_name)"
        )
        .order("data_hora", { ascending: false }),
    ]);

  const summary = summaryRows?.[0] ?? {
    available_balance: 0,
    total_empenhado: 0,
    projected_profit: 0,
  };

  const stats: KpiItem[] = [
    {
      label: "Saldo em Caixa Disponível",
      value: formatCurrency(Number(summary.available_balance ?? 0)),
      icon: Wallet,
    },
    {
      label: "Total Empenhado",
      value: formatCurrency(Number(summary.total_empenhado ?? 0)),
      icon: BanknoteArrowDown,
    },
    {
      label: "Lucro Previsto",
      value: formatCurrency(Number(summary.projected_profit ?? 0)),
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
        <h2 className="mb-3 text-lg font-bold">Extrato de entradas, saídas e compras</h2>
        <CashLedgerTable expenses={expenses ?? []} payments={payments ?? []} purchases={purchases ?? []} />
      </div>
    </div>
  );
}
