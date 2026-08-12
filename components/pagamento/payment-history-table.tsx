import { Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PaymentStatusPill } from "@/components/pagamento/payment-status-pill";
import { formatCurrency, formatDateTime } from "@/lib/format";

type Payment = {
  id: string;
  created_at: string;
  expected_amount: number;
  user_declared_amount: number;
  admin_typed_amount: number | null;
  is_partial: boolean;
  status: string;
};

export function PaymentHistoryTable({ payments }: { payments: Payment[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Histórico de pagamentos</CardTitle>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Receipt className="h-6 w-6 text-muted-foreground" />
            </span>
            <p className="text-sm text-muted-foreground">
              Nenhum pagamento declarado até o momento.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Data/Hora</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Valor Esperado</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Valor Declarado</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Valor Conferido</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDateTime(p.created_at)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(p.expected_amount)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(p.user_declared_amount)}
                      {p.is_partial && (
                        <span className="ml-1 text-xs text-muted-foreground">(parcial)</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {p.admin_typed_amount !== null ? formatCurrency(p.admin_typed_amount) : "—"}
                    </TableCell>
                    <TableCell>
                      <PaymentStatusPill status={p.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
