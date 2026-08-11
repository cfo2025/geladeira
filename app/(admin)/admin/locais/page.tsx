import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreateLocationDialog } from "@/components/admin/create-location-dialog";
import { EditLocationDialog } from "@/components/admin/edit-location-dialog";

export default async function AdminLocaisPage() {
  const supabase = await createClient();
  const { data: locations } = await supabase.from("locations").select("*").order("name");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Locais</h1>
          <p className="text-muted-foreground">Locais de armazenamento disponíveis na loja.</p>
        </div>
        <CreateLocationDialog />
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(locations ?? []).map((loc) => (
                <TableRow key={loc.id}>
                  <TableCell className="font-medium">{loc.name}</TableCell>
                  <TableCell className="text-muted-foreground">{loc.description ?? "—"}</TableCell>
                  <TableCell>
                    <EditLocationDialog id={loc.id} name={loc.name} description={loc.description} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
