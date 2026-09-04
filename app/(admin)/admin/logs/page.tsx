import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LogDetailDialog } from "@/components/admin/log-detail-dialog";
import { getLogPresentation, TONE_CLASSES } from "@/lib/log-presentation";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";

export default async function AdminLogsPage() {
  const supabase = await createClient();

  const [{ data: logs }, { data: products }, { data: locations }] = await Promise.all([
    supabase
      .from("audit_logs")
      .select(
        "id, action, details, created_at, actor:profiles!audit_logs_actor_id_fkey(full_name), target:profiles!audit_logs_target_user_id_fkey(full_name)"
      )
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.from("products").select("id, name"),
    supabase.from("locations").select("id, name"),
  ]);

  const productsMap = Object.fromEntries((products ?? []).map((p) => [p.id, p.name]));
  const locationsMap = Object.fromEntries((locations ?? []).map((l) => [l.id, l.name]));

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
                <TableHead className="text-right">Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(logs ?? []).map((log) => {
                const actorName = log.actor?.full_name ?? "Sistema";
                const targetName = log.target?.full_name ?? "—";
                const details = (log.details as Record<string, unknown> | null) ?? null;
                const presentation = getLogPresentation(log.action, details, {
                  actorName,
                  targetName,
                  products: productsMap,
                  locations: locationsMap,
                });
                const Icon = presentation.icon;
                const toneClasses = TONE_CLASSES[presentation.tone];

                return (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">{formatDateTime(log.created_at)}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                          toneClasses.bg,
                          toneClasses.text
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {presentation.title}
                      </span>
                    </TableCell>
                    <TableCell>{actorName}</TableCell>
                    <TableCell>{targetName}</TableCell>
                    <TableCell className="text-right">
                      <LogDetailDialog
                        action={log.action}
                        details={details}
                        actorName={actorName}
                        targetName={targetName}
                        createdAt={log.created_at}
                        products={productsMap}
                        locations={locationsMap}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
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
