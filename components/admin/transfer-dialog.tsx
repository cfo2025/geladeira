"use client";

import { useActionState, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { transferInventory, type ActionResult } from "@/app/actions/admin/catalog";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export function TransferDialog({
  locations,
  locationTotals,
  fromLocationId,
  fromLocationName,
  productId,
  productName,
  currentQuantity,
  disabled = false,
}: {
  locations: { id: string; name: string }[];
  locationTotals: Record<string, number>;
  fromLocationId: string;
  fromLocationName: string;
  productId: string;
  productName: string;
  currentQuantity: number;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [toLocationId, setToLocationId] = useState("");
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(transferInventory, {});
  const destinations = locations.filter((l) => l.id !== fromLocationId);

  useActionFeedback(state, {
    successMessage: "Estoque transferido",
    onSuccess: () => {
      setOpen(false);
      setToLocationId("");
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setToLocationId("");
      }}
    >
      <DialogTrigger
        render={
          <Button
            size="icon-sm"
            variant="outline"
            disabled={disabled}
            title={disabled ? "Sem estoque disponível para transferir" : "Transferir para outra geladeira"}
            aria-label="Transferir estoque"
          />
        }
      >
        <ArrowLeftRight className="h-3.5 w-3.5" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4 text-gold" />
            Transferir estoque
          </DialogTitle>
          <DialogDescription>
            {productName} &middot; de {fromLocationName} &middot; disponível: {currentQuantity} un.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="fromLocationId" value={fromLocationId} />
          <input type="hidden" name="productId" value={productId} />
          <input type="hidden" name="toLocationId" value={toLocationId} />

          <div className="space-y-2">
            <Label>Para qual geladeira?</Label>
            <div className="grid grid-cols-2 gap-2">
              {destinations.map((loc) => (
                <LocationCard
                  key={loc.id}
                  name={loc.name}
                  totalItems={locationTotals[loc.id] ?? 0}
                  active={loc.id === toLocationId}
                  onSelect={() => setToLocationId(loc.id)}
                  compact
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantidade a transferir</Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              min="1"
              max={currentQuantity}
              step="1"
              required
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending || !toLocationId}>
              {pending ? "Transferindo..." : "Confirmar transferência"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
