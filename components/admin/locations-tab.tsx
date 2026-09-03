import { Refrigerator } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EditLocationDialog } from "@/components/admin/edit-location-dialog";
import { ConfirmDeleteDialog } from "@/components/admin/confirm-delete-dialog";
import { deleteLocation } from "@/app/actions/admin/catalog";

type LocationRow = { id: string; name: string; description: string | null };

export function LocationsTab({
  locations,
  stockByLocation,
}: {
  locations: LocationRow[];
  stockByLocation: Record<string, number>;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Geladeiras e locais de armazenamento cadastrados.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {locations.map((loc) => {
          const stock = stockByLocation[loc.id] ?? 0;
          return (
            <Card key={loc.id}>
              <CardContent className="flex items-start gap-3 pt-6">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent">
                  <Refrigerator className="h-5 w-5 text-gold" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{loc.name}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {loc.description || "Sem descrição"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <EditLocationDialog id={loc.id} name={loc.name} description={loc.description} />
                  <ConfirmDeleteDialog
                    title="Excluir local"
                    description={`Isso remove "${loc.name}" definitivamente. Esta ação não pode ser desfeita.`}
                    action={() => deleteLocation(loc.id)}
                    disabled={stock > 0}
                    disabledReason="Zere o estoque deste local para excluir"
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
        {locations.length === 0 && (
          <p className="col-span-full text-center text-muted-foreground">Nenhum local cadastrado.</p>
        )}
      </div>
    </div>
  );
}
