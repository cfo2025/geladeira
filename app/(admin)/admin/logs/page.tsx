import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";

const ACTION_LABELS: Record<string, string> = {
  user_created: "Usuário criado",
  user_deactivated: "Usuário desativado",
  user_reactivated: "Usuário reativado",
  password_reset: "Senha redefinida",
  cancellation_requested: "Cancelamento solicitado",
  cancellation_reviewed: "Cancelamento revisado",
  payment_reviewed: "Pagamento revisado",
  stock_audit_created: "Balanço de estoque criado",
  stock_audit_applied: "Balanço aplicado ao estoque",
};

export default async function AdminLogsPage() {
  const supabase = await createClient();

  const { data: logs } = await supabase
    .from("audit_logs")
    .select(
      "id, action, details, created_at, actor:profiles!audit_logs_actor_id_fkey(full_name), target:profiles!audit_logs_target_user_id_fkey(full_name)"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Logs de auditoria</h1>
        <p className="text-muted-foreground">Ações administrativas recentes no sistema.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Alvo</TableHead>
                <TableHead>Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(logs ?? []).map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap">{formatDateTime(log.created_at)}</TableCell>
                  <TableCell>{ACTION_LABELS[log.action] ?? log.action}</TableCell>
                  <TableCell>{log.actor?.full_name ?? "—"}</TableCell>
                  <TableCell>{log.target?.full_name ?? "—"}</TableCell>
                  <TableCell className="max-w-xs truncate font-mono text-xs text-muted-foreground">
                    {log.details ? JSON.stringify(log.details) : ""}
                  </TableCell>
                </TableRow>
              ))}
              {(!logs || logs.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhum registro ainda.
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
