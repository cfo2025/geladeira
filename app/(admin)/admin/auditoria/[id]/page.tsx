import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ApplyAuditButton } from "@/components/admin/apply-audit-button";
import { formatDateTime } from "@/lib/format";
import { FileDown } from "lucide-react";

export default async function AuditoriaDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: audit } = await supabase
    .from("stock_audits")
    .select("*, location:locations(name), admin:profiles(full_name)")
    .eq("id", id)
    .single();

  if (!audit) notFound();

  const { data: items } = await supabase
    .from("stock_audit_items")
    .select("*, product:products(name)")
    .eq("audit_id", id);

  const hasPendingDifferences = (items ?? []).some((i) => i.difference !== 0 && !i.applied_at);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Balanço — {audit.location?.name}
          </h1>
          <p className="text-muted-foreground">
            {formatDateTime(audit.created_at)} · responsável: {audit.admin?.full_name}
          </p>
          {audit.notes && <p className="mt-1 text-sm">{audit.notes}</p>}
        </div>
        <div className="flex gap-2">
          <Button
            render={<a href={`/api/admin/auditoria/${id}/pdf`} target="_blank" rel="noreferrer" />}
            nativeButton={false}
            variant="outline"
          >
            <FileDown className="mr-1 h-4 w-4" /> Baixar PDF
          </Button>
          {hasPendingDifferences && <ApplyAuditButton auditId={id} />}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Itens</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Esperado</TableHead>
                <TableHead className="text-right">Físico</TableHead>
                <TableHead className="text-right">Diferença</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(items ?? []).map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.product?.name}</TableCell>
                  <TableCell className="text-right">{item.expected_quantity}</TableCell>
                  <TableCell className="text-right">{item.physical_quantity}</TableCell>
                  <TableCell
                    className={`text-right font-medium ${
                      item.difference < 0
                        ? "text-destructive"
                        : item.difference > 0
                          ? "text-green-600"
                          : "text-muted-foreground"
                    }`}
                  >
                    {item.difference > 0 ? `+${item.difference}` : item.difference}
                    {item.difference !== 0 && item.applied_at && (
                      <span className="ml-1.5 text-xs font-normal text-muted-foreground">(aplicado)</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Button render={<Link href="/admin/retiradas" />} nativeButton={false} variant="ghost" size="sm">
        Voltar para Retiradas
      </Button>
    </div>
  );
}
