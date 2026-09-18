"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ArrowRight, Scale, TriangleAlert } from "lucide-react";
import { adjustInventoryManual } from "@/app/actions/admin/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function AdjustStockDialog({
  productId,
  productName,
  locationId,
  locationName,
  currentQuantity,
  onAdjusted,
}: {
  productId: string;
  productName: string;
  locationId: string;
  locationName: string;
  currentQuantity: number;
  onAdjusted?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [newQuantity, setNewQuantity] = useState(String(currentQuantity));
  const [reason, setReason] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  const parsed = Number(newQuantity);
  const quantityValid = newQuantity.trim() !== "" && Number.isInteger(parsed) && parsed >= 0;
  const difference = quantityValid ? parsed - currentQuantity : 0;
  const canReview = quantityValid && difference !== 0 && reason.trim().length >= 3;

  function reset() {
    setNewQuantity(String(currentQuantity));
    setReason("");
    setConfirming(false);
  }

  function handleConfirm() {
    startTransition(async () => {
      const result = await adjustInventoryManual({
        locationId,
        productId,
        newQuantity: parsed,
        reason: reason.trim(),
      });
      if (result.error) {
        toast.error(result.error);
        setConfirming(false);
        return;
      }
      toast.success("Estoque ajustado");
      setOpen(false);
      onAdjusted?.();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        reset();
      }}
    >
      <DialogTrigger render={<Button type="button" variant="outline" className="w-full" />}>
        <Scale className="h-4 w-4" />
        Ajustar estoque manualmente
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-gold" />
            Ajuste manual de estoque
          </DialogTitle>
          <DialogDescription>
            {productName} · {locationName}
          </DialogDescription>
        </DialogHeader>

        {!confirming ? (
          <div className="space-y-4">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div className="rounded-xl border bg-muted/40 p-3 text-center">
                <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                  Atual
                </p>
                <p className="text-2xl font-bold tabular-nums">{currentQuantity}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <div className="rounded-xl border border-gold/40 bg-gold/5 p-3 text-center">
                <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                  Novo
                </p>
                <p className="text-2xl font-bold tabular-nums">{quantityValid ? parsed : "—"}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new_quantity">Nova quantidade</Label>
              <Input
                id="new_quantity"
                type="number"
                min={0}
                step={1}
                value={newQuantity}
                onChange={(e) => setNewQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adjust_reason">Motivo do ajuste</Label>
              <Textarea
                id="adjust_reason"
                rows={3}
                maxLength={500}
                placeholder="Ex: contagem física divergente, item vencido, quebra..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button type="button" disabled={!canReview} onClick={() => setConfirming(true)}>
                Revisar ajuste
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400">
                <TriangleAlert className="h-4 w-4" />
                Confirme a mudança
              </div>
              <p className="text-3xl font-bold tabular-nums">
                {currentQuantity} <span className="text-muted-foreground">→</span> {parsed}
              </p>
              <p
                className={cn(
                  "text-sm font-semibold tabular-nums",
                  difference > 0 ? "text-green-600 dark:text-green-400" : "text-destructive"
                )}
              >
                {difference > 0 ? `+${difference}` : difference} un.
              </p>
              <p className="text-xs text-muted-foreground">Motivo: {reason.trim()}</p>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Fica registrado em Logs em destaque.
            </p>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => setConfirming(false)}
              >
                Voltar
              </Button>
              <Button type="button" disabled={pending} onClick={handleConfirm}>
                {pending ? "Ajustando..." : "Confirmar ajuste"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
