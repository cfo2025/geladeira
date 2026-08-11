import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { WithdrawalStatusBadge } from "@/components/status-badge";
import { CancellationReviewButtons } from "@/components/admin/cancellation-review-buttons";
import { formatCurrency, formatDateTime } from "@/lib/format";

export default async function AdminRetiradasPage() {
  const supabase = await createClient();

  const [{ data: requests }, { data: withdrawals }] = await Promise.all([
    supabase
      .from("withdrawal_cancellation_requests")
      .select(
        "id, reason, status, created_at, profile:profiles!withdrawal_cancellation_requests_user_id_fkey(full_name), withdrawal:withdrawals(quantity, unit_price_at_withdrawal, product:products(name))"
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("withdrawals")
      .select(
        "id, quantity, unit_price_at_withdrawal, status, created_at, profile:profiles(full_name), product:products(name), location:locations(name)"
      )
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  const pendingRequests = (requests ?? []).filter((r) => r.status === "pending");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Retiradas</h1>
        <p className="text-muted-foreground">Solicitações de cancelamento e histórico de retiradas.</p>
      </div>

      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests">Cancelamentos pendentes ({pendingRequests.length})</TabsTrigger>
          <TabsTrigger value="all">Todas as retiradas</TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingRequests.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap">{formatDateTime(r.created_at)}</TableCell>
                      <TableCell>{r.profile?.full_name}</TableCell>
                      <TableCell>{r.withdrawal?.product?.name}</TableCell>
                      <TableCell className="max-w-xs">{r.reason}</TableCell>
                      <TableCell>
                        <CancellationReviewButtons requestId={r.id} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {pendingRequests.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Nenhuma solicitação pendente.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Local</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(withdrawals ?? []).map((w) => (
                    <TableRow key={w.id}>
                      <TableCell className="whitespace-nowrap">{formatDateTime(w.created_at)}</TableCell>
                      <TableCell>{w.profile?.full_name}</TableCell>
                      <TableCell>{w.product?.name}</TableCell>
                      <TableCell>{w.location?.name}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(w.unit_price_at_withdrawal * w.quantity)}
                      </TableCell>
                      <TableCell>
                        <WithdrawalStatusBadge status={w.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!withdrawals || withdrawals.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        Nenhuma retirada registrada.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
