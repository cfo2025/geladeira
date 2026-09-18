"use client";

import { useActionState, useState, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { updateProduct, adjustInventoryManual, type ActionResult } from "@/app/actions/admin/catalog";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil, Package, TriangleAlert } from "lucide-react";

export function EditProductDialog({
  id,
  name,
  category,
  imageUrl,
  locationId,
  locationName,
  currentQuantity,
}: {
  id: string;
  name: string;
  category: string | null;
  imageUrl: string | null;
  locationId: string;
  locationName: string;
  currentQuantity: number;
}) {
  const [open, setOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(imageUrl ?? "");
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(updateProduct, {});
  const [newQuantity, setNewQuantity] = useState(String(currentQuantity));
  const [reason, setReason] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [adjusting, startAdjust] = useTransition();

  useActionFeedback(state, {
    successMessage: "Produto atualizado",
    onSuccess: () => setOpen(false),
  });

  const parsedQuantity = Number(newQuantity);
  const quantityValid = newQuantity.trim() !== "" && Number.isInteger(parsedQuantity) && parsedQuantity >= 0;
  const difference = quantityValid ? parsedQuantity - currentQuantity : 0;
  const canReview = quantityValid && difference !== 0 && reason.trim().length >= 3;

  function resetAdjustment() {
    setNewQuantity(String(currentQuantity));
    setReason("");
    setConfirming(false);
  }

  function handleConfirmAdjustment() {
    startAdjust(async () => {
      const result = await adjustInventoryManual({
        locationId,
        productId: id,
        newQuantity: parsedQuantity,
        reason: reason.trim(),
      });
      if (result.error) {
        toast.error(result.error);
        setConfirming(false);
      } else {
        toast.success("Estoque ajustado");
        setOpen(false);
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setPreviewUrl(imageUrl ?? "");
        resetAdjustment();
      }}
    >
      <DialogTrigger render={<Button size="icon-sm" variant="ghost" title="Editar produto" />}>
        <Pencil className="h-3.5 w-3.5" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-4 w-4 text-gold" />
            Editar produto
          </DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="id" value={id} />
          <div className="flex items-center gap-3">
            <span className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted/50 ring-1 ring-border">
              {previewUrl ? (
                <Image
                  src={previewUrl}
                  alt=""
                  fill
                  className="object-contain p-1.5"
                  unoptimized
                  onError={() => setPreviewUrl("")}
                />
              ) : (
                <Package className="h-6 w-6 text-muted-foreground/40" />
              )}
            </span>
            <div className="flex-1 space-y-2">
              <Label htmlFor="image_url">URL da foto (opcional)</Label>
              <Input
                id="image_url"
                name="image_url"
                type="url"
                defaultValue={imageUrl ?? ""}
                placeholder="https://..."
                onChange={(e) => setPreviewUrl(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" defaultValue={name} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Categoria (opcional)</Label>
            <Input id="category" name="category" defaultValue={category ?? ""} placeholder="Ex: Bebida" />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>

        <div className="space-y-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <TriangleAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            Ajuste manual de estoque
          </div>
          <p className="text-xs text-muted-foreground">
            Define o estoque atual em <span className="font-medium">{locationName}</span> (hoje:{" "}
            <span className="font-medium">{currentQuantity} un.</span>). Fica registrado em Logs em destaque.
          </p>

          {!confirming ? (
            <>
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
                  rows={2}
                  maxLength={500}
                  placeholder="Ex: contagem física divergente, item vencido, quebra..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={!canReview}
                onClick={() => setConfirming(true)}
              >
                Revisar ajuste
              </Button>
            </>
          ) : (
            <div className="space-y-3">
              <div className="rounded-lg bg-background p-3 text-sm">
                <p>
                  Estoque de <span className="font-semibold">{name}</span> em {locationName}:
                </p>
                <p className="mt-1 text-lg font-bold tabular-nums">
                  {currentQuantity} → {parsedQuantity}{" "}
                  <span
                    className={
                      difference > 0
                        ? "text-sm text-green-600 dark:text-green-400"
                        : "text-sm text-destructive"
                    }
                  >
                    ({difference > 0 ? `+${difference}` : difference})
                  </span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Motivo: {reason.trim()}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  disabled={adjusting}
                  onClick={() => setConfirming(false)}
                >
                  Voltar
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  disabled={adjusting}
                  onClick={handleConfirmAdjustment}
                >
                  {adjusting ? "Ajustando..." : "Confirmar ajuste"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
