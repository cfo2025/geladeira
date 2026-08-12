import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { formatDateTime } from "@/lib/format";

export default async function AdminAuditoriaPage() {
  const supabase = await createClient();

  const [{ data: audits }, { data: locations }] = await Promise.all([
    supabase
      .from("stock_audits")
      .select("id, notes, created_at, location:locations(name), admin:profiles(full_name)")
      .order("created_at", { ascending: false }),
    supabase.from("locations").select("id, name").order("name"),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Auditoria de estoque</h1>
          <p className="text-muted-foreground">Balanços físicos de estoque por local.</p>
        </div>
        {locations && locations.length > 0 && (
          <Button
            render={<Link href={`/admin/auditoria/novo?location=${locations[0].id}`} />}
            nativeButton={false}
            size="sm"
          >
            <Plus className="mr-1 h-4 w-4" /> Novo balanço
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Local</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Observações</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(audits ?? []).map((audit) => (
                <TableRow key={audit.id}>
                  <TableCell className="whitespace-nowrap">{formatDateTime(audit.created_at)}</TableCell>
                  <TableCell>{audit.location?.name}</TableCell>
                  <TableCell>{audit.admin?.full_name}</TableCell>
                  <TableCell className="max-w-xs truncate">{audit.notes ?? "—"}</TableCell>
                  <TableCell>
                    <Button
                      render={<Link href={`/admin/auditoria/${audit.id}`} />}
                      nativeButton={false}
                      variant="ghost"
                      size="sm"
                    >
                      Ver detalhes
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!audits || audits.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhum balanço realizado ainda.
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
