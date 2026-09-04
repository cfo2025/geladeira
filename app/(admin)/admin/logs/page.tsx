import { createClient } from "@/lib/supabase/server";
import { LogsTable } from "@/components/admin/logs-table";
import type { AuditDiffItem } from "@/lib/log-presentation";

export default async function AdminLogsPage() {
  const supabase = await createClient();

  const [{ data: logs }, { data: products }, { data: locations }, { data: auditItems }] = await Promise.all([
    supabase
      .from("audit_logs")
      .select(
        "id, action, details, created_at, actor:profiles!audit_logs_actor_id_fkey(full_name), target:profiles!audit_logs_target_user_id_fkey(full_name)"
      )
      .order("created_at", { ascending: false })
      .limit(500),
    supabase.from("products").select("id, name"),
    supabase.from("locations").select("id, name"),
    supabase.from("stock_audit_items").select("audit_id, difference, product:products(name)").neq("difference", 0),
  ]);

  const productsMap = Object.fromEntries((products ?? []).map((p) => [p.id, p.name]));
  const locationsMap = Object.fromEntries((locations ?? []).map((l) => [l.id, l.name]));

  const auditDiffsMap: Record<string, AuditDiffItem[]> = {};
  for (const item of auditItems ?? []) {
    const list = auditDiffsMap[item.audit_id] ?? (auditDiffsMap[item.audit_id] = []);
    list.push({ product_name: item.product?.name ?? "—", difference: item.difference });
  }

  const logRows = (logs ?? []).map((log) => ({
    id: log.id,
    action: log.action,
    details: (log.details as Record<string, unknown> | null) ?? null,
    created_at: log.created_at,
    actorName: log.actor?.full_name ?? "Sistema",
    targetName: log.target?.full_name ?? "—",
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Logs de auditoria</h1>
        <p className="text-muted-foreground">Ações administrativas recentes no sistema.</p>
      </div>

      <LogsTable
        logs={logRows}
        products={productsMap}
        locations={locationsMap}
        auditDiffs={auditDiffsMap}
      />
    </div>
  );
}
