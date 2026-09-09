import { Refrigerator } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EditLocationDialog } from "@/components/admin/edit-location-dialog";
import { LocationActiveSwitch } from "@/components/admin/location-active-switch";
import { ConfirmDeleteDialog } from "@/components/admin/confirm-delete-dialog";
import { deleteLocation } from "@/app/actions/admin/catalog";
import { cn } from "@/lib/utils";

type LocationRow = { id: string; name: string; description: string | null; is_active: boolean };

export function LocationsTab({
  locations,
  stockByLocation,
  hasHistory,
}: {
  locations: LocationRow[];
  stockByLocation: Record<string, number>;
  hasHistory: Record<string, boolean>;
}) {
  const sorted = [...locations].sort((a, b) => Number(b.is_active) - Number(a.is_active));

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Geladeiras e locais de armazenamento cadastrados. Desativar some o local das telas de uso
        (loja, novo lançamento, balanço) sem apagar nada — o histórico continua mostrando o nome
        normalmente.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((loc) => {
          const stock = stockByLocation[loc.id] ?? 0;
          const canHardDelete = !hasHistory[loc.id];
          return (
            <Card key={loc.id} className={cn(!loc.is_active && "opacity-60")}>
              <CardContent className="flex items-start gap-3 pt-6">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent">
                  <Refrigerator className="h-5 w-5 text-gold" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate text-sm font-semibold">
                    {loc.name}
                    {!loc.is_active && (
                      <Badge variant="secondary" className="shrink-0">
                        Inativo
                      </Badge>
                    )}
                  </p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {loc.description || "Sem descrição"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <LocationActiveSwitch id={loc.id} isActive={loc.is_active} />
                  <EditLocationDialog id={loc.id} name={loc.name} description={loc.description} />
                  <ConfirmDeleteDialog
                    title="Excluir local"
                    description={`Isso remove "${loc.name}" definitivamente. Esta ação não pode ser desfeita.`}
                    action={() => deleteLocation(loc.id)}
                    disabled={stock > 0 || !canHardDelete}
                    disabledReason={
                      stock > 0
                        ? "Zere o estoque deste local para excluir"
                        : "Este local já tem retiradas/balanços registrados — desative em vez de excluir"
                    }
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
