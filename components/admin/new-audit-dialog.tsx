"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { ClipboardCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { createStockAudit, type ActionResult } from "@/app/actions/admin/audits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LocationCard } from "@/components/loja/location-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type InventoryItem = { location_id: string; product_id: string; product_name: string; quantity: number };

function defaultCounts(items: InventoryItem[], locationId: string) {
  return Object.fromEntries(
    items.filter((i) => i.location_id === locationId).map((i) => [i.product_id, String(i.quantity)])
  );
}

const PAGE_SIZE = 5;

export function NewAuditDialog({
  locations,
  inventory,
}: {
  locations: { id: string; name: string }[];
  inventory: InventoryItem[];
}) {
  const [open, setOpen] = useState(false);
  const [locationId, setLocationId] = useState(locations[0]?.id ?? "");
  const [counts, setCounts] = useState<Record<string, string>>(() =>
    defaultCounts(inventory, locations[0]?.id ?? "")
  );
  const [page, setPage] = useState(0);
  const [pending, startTransition] = useTransition();

  const items = useMemo(
    () =>
      inventory
        .filter((i) => i.location_id === locationId)
        .sort((a, b) => a.product_name.localeCompare(b.product_name)),
    [inventory, locationId]
  );

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const pageItems = items.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);

  function handleSelectLocation(id: string) {
    setLocationId(id);
    setCounts(defaultCounts(inventory, id));
    setPage(0);
  }

  function handleSubmit(formData: FormData) {
    const payloadItems = items.map((i) => ({
      product_id: i.product_id,
      physical_quantity: Number(counts[i.product_id] ?? 0),
    }));
    formData.set("locationId", locationId);
    formData.set("items", JSON.stringify(payloadItems));

    startTransition(async () => {
      const result: ActionResult = await createStockAudit(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Balanço registrado");
        setOpen(false);
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) handleSelectLocation(locations[0]?.id ?? "");
      }}
    >
      <DialogTrigger render={<Button size="sm" />}>
        <ClipboardCheck className="h-4 w-4" />
        Novo balanço
      </DialogTrigger>
      <DialogContent className="flex max-h-[88vh] flex-col sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo balanço de estoque</DialogTitle>
          <DialogDescription>
            Informe a contagem física de cada produto. A diferença em relação ao estoque esperado é
            calculada automaticamente.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="grid grid-cols-3 gap-2">
            {locations.map((loc) => (
              <LocationCard
                key={loc.id}
                name={loc.name}
                totalItems={inventory.filter((i) => i.location_id === loc.id).length}
                active={loc.id === locationId}
                onSelect={() => handleSelectLocation(loc.id)}
                compact
              />
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border">
            {items.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">
                Nenhum produto com estoque cadastrado neste local.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Esperado</TableHead>
                    <TableHead className="text-right">Físico</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageItems.map((item) => (
                    <TableRow key={item.product_id}>
                      <TableCell className="font-medium">{item.product_name}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min={0}
                          className="ml-auto w-20"
                          value={counts[item.product_id] ?? ""}
                          onChange={(e) =>
                            setCounts((prev) => ({ ...prev, [item.product_id]: e.target.value }))
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon-xs"
                disabled={currentPage === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                aria-label="Página anterior"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs text-muted-foreground">
                Página {currentPage + 1} de {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon-xs"
                disabled={currentPage >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                aria-label="Próxima página"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea id="notes" name="notes" maxLength={1000} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending || items.length === 0}>
              {pending ? "Salvando..." : "Registrar balanço"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
