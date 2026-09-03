import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReviewPaymentDialog } from "@/components/admin/review-payment-dialog";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { HandCoins, Inbox } from "lucide-react";

type PendingPayment = {
  id: string;
  created_at: string;
  expected_amount: number;
  user_declared_amount: number;
  is_partial: boolean | null;
  profile: { full_name: string } | null;
};

export function PendingPaymentsCard({ payments }: { payments: PendingPayment[] }) {
  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <HandCoins className="h-4 w-4 text-gold" />
          Pagamentos pendentes
          {payments.length > 0 && (
            <span className="ml-auto text-xs font-normal text-muted-foreground">
              {payments.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-10 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-muted">
              <Inbox className="h-5 w-5 text-muted-foreground" />
            </span>
            <p className="text-sm text-muted-foreground">Nenhum pagamento aguardando aprovação.</p>
          </div>
        ) : (
          payments.map((p) => (
            <div key={p.id} className="rounded-xl border p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{p.profile?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(p.created_at)}</p>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Esperado</p>
                  <p className="font-semibold tabular-nums">{formatCurrency(p.expected_amount)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Declarado</p>
                  <p className="font-semibold tabular-nums">
                    {formatCurrency(p.user_declared_amount)}
                    {p.is_partial && <span className="ml-1 text-xs font-normal">(parcial)</span>}
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <ReviewPaymentDialog
                  paymentId={p.id}
                  userName={p.profile?.full_name ?? ""}
                  expectedAmount={p.expected_amount}
                  userDeclaredAmount={p.user_declared_amount}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
