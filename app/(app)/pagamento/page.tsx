import { requireUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PaymentStatusBadge } from "@/components/status-badge";
import { PixInfo } from "@/components/pix-info";
import { DeclarePaymentForm } from "@/components/declare-payment-form";
import { DivergenceCard } from "@/components/divergence-card";
import { formatCurrency, formatDateTime } from "@/lib/format";

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
  const pixReceiver = process.env.NEXT_PUBLIC_PIX_RECEIVER_NAME ?? "Loja Honesta";
  const numericBalance = Number(balance ?? 0);

  const latestUnresolved = (payments ?? []).find(
    (p) => p.status === "rejected_divergent" || p.status === "rejected_unpaid"
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pagamento</h1>
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
            Você não possui saldo em aberto no momento.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Saldo em aberto: {formatCurrency(numericBalance)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {pixKey ? (
              <PixInfo pixKey={pixKey} receiverName={pixReceiver} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Chave Pix ainda não configurada. Procure a administração.
              </p>
            )}
            <DeclarePaymentForm balance={numericBalance} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico de pagamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Esperado</TableHead>
                <TableHead className="text-right">Declarado</TableHead>
                <TableHead className="text-right">Conferido</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(payments ?? []).map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="whitespace-nowrap">{formatDateTime(p.created_at)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(p.expected_amount)}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(p.user_declared_amount)}
                    {p.is_partial && (
                      <span className="ml-1 text-xs text-muted-foreground">(parcial)</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {p.admin_typed_amount !== null ? formatCurrency(p.admin_typed_amount) : "—"}
                  </TableCell>
                  <TableCell>
                    <PaymentStatusBadge status={p.status} />
                  </TableCell>
                </TableRow>
              ))}
              {(!payments || payments.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhum pagamento declarado ainda.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
