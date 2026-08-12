import { requireUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { PixInstructionsCard } from "@/components/pagamento/pix-instructions-card";
import { DeclarePaymentForm } from "@/components/pagamento/declare-payment-form";
import { PaymentHistoryTable } from "@/components/pagamento/payment-history-table";
import { DivergenceCard } from "@/components/divergence-card";
import { formatCurrency } from "@/lib/format";

export default async function PagamentoPage() {
  const { userId } = await requireUser();
  const supabase = await createClient();

  const [{ data: balance }, { data: payments }] = await Promise.all([
    supabase.rpc("get_my_balance"),
    supabase
      .from("payments")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  const pixKey = process.env.NEXT_PUBLIC_PIX_KEY;
  const qrCodeUrl = process.env.NEXT_PUBLIC_PIX_QR_CODE_URL;
  const numericBalance = Number(balance ?? 0);

  const latestUnresolved = (payments ?? []).find(
    (p) => p.status === "rejected_divergent" || p.status === "rejected_unpaid"
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pagamento</h1>
        <p className="text-muted-foreground">Pague via Pix e declare o valor pago.</p>
      </div>

      {latestUnresolved && (
        <DivergenceCard
          paymentId={latestUnresolved.id}
          notes={latestUnresolved.divergence_notes}
          notifiedAt={latestUnresolved.divergence_notified_at}
        />
      )}

      {numericBalance <= 0 ? (
        <Card>
          <CardContent className="pt-6 text-muted-foreground">
            Você não possui saldo em aberto no momento. Valor atual: {formatCurrency(numericBalance)}.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <PixInstructionsCard pixKey={pixKey} qrCodeUrl={qrCodeUrl} />
          <DeclarePaymentForm balance={numericBalance} />
        </div>
      )}

      <PaymentHistoryTable payments={payments ?? []} />
    </div>
  );
}
