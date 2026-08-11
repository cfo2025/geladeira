import Link from "next/link";
import { requireUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { WithdrawalStatusBadge } from "@/components/status-badge";
import { CancellationDialog } from "@/components/cancellation-dialog";
import { formatCurrency, formatDateTime } from "@/lib/format";

export default async function ExtratoPage() {
  const { userId } = await requireUser();
  const supabase = await createClient();

  const [{ data: balance }, { data: withdrawals }] = await Promise.all([
    supabase.rpc("get_my_balance"),
    supabase
      .from("withdrawals")
      .select(
        "id, quantity, unit_price_at_withdrawal, status, payment_id, created_at, product:products(name), location:locations(name)"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Extrato</h1>
          <p className="text-muted-foreground">Suas retiradas e o saldo em aberto.</p>
        </div>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              Saldo em aberto
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between gap-6">
              <span className="text-2xl font-bold">{formatCurrency(Number(balance ?? 0))}</span>
              {Number(balance ?? 0) > 0 && (
                <Button render={<Link href="/pagamento" />} size="sm">
                  Pagar agora
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Local</TableHead>
                <TableHead className="text-right">Qtd.</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(withdrawals ?? []).map((w) => (
                <TableRow key={w.id}>
                  <TableCell className="whitespace-nowrap">{formatDateTime(w.created_at)}</TableCell>
                  <TableCell>{w.product?.name}</TableCell>
                  <TableCell>{w.location?.name}</TableCell>
                  <TableCell className="text-right">{w.quantity}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(w.unit_price_at_withdrawal * w.quantity)}
                  </TableCell>
                  <TableCell>
                    <WithdrawalStatusBadge status={w.status} />
                  </TableCell>
                  <TableCell>
                    {w.status === "completed" && !w.payment_id && (
                      <CancellationDialog withdrawalId={w.id} productName={w.product?.name ?? ""} />
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {(!withdrawals || withdrawals.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Nenhuma retirada registrada ainda.
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
