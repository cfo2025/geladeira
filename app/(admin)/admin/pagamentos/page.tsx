import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PaymentStatusBadge } from "@/components/status-badge";
import { ReviewPaymentDialog } from "@/components/admin/review-payment-dialog";
import { formatCurrency, formatDateTime } from "@/lib/format";

export default async function AdminPagamentosPage() {
  const supabase = await createClient();
  const { data: payments } = await supabase
    .from("payments")
    .select("*, profile:profiles(full_name)")
    .order("created_at", { ascending: false });

  const pending = (payments ?? []).filter((p) => p.status === "pending");
  const reviewed = (payments ?? []).filter((p) => p.status !== "pending");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pagamentos</h1>
        <p className="text-muted-foreground">Confira os pagamentos Pix declarados pelos usuários.</p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pendentes ({pending.length})</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead className="text-right">Esperado</TableHead>
                    <TableHead className="text-right">Declarado</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pending.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatDateTime(p.created_at)}
                      </TableCell>
                      <TableCell>{p.profile?.full_name}</TableCell>
                      <TableCell className="text-right">{formatCurrency(p.expected_amount)}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(p.user_declared_amount)}
                        {p.is_partial && (
                          <span className="ml-1 text-xs text-muted-foreground">(parcial)</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <ReviewPaymentDialog
                          paymentId={p.id}
                          userName={p.profile?.full_name ?? ""}
                          expectedAmount={p.expected_amount}
                          userDeclaredAmount={p.user_declared_amount}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {pending.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Nenhum pagamento pendente.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead className="text-right">Esperado</TableHead>
                    <TableHead className="text-right">Conferido</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviewed.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatDateTime(p.created_at)}
                      </TableCell>
                      <TableCell>{p.profile?.full_name}</TableCell>
                      <TableCell className="text-right">{formatCurrency(p.expected_amount)}</TableCell>
                      <TableCell className="text-right">
                        {p.admin_typed_amount !== null ? formatCurrency(p.admin_typed_amount) : "—"}
                      </TableCell>
                      <TableCell>
                        <PaymentStatusBadge status={p.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {reviewed.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Nenhum pagamento revisado ainda.
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
