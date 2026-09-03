"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import { updateProduct, type ActionResult } from "@/app/actions/admin/catalog";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil, Package } from "lucide-react";

export function EditProductDialog({
  id,
  name,
  category,
  imageUrl,
}: {
  id: string;
  name: string;
  category: string | null;
  imageUrl: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(imageUrl ?? "");
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(updateProduct, {});

  useActionFeedback(state, {
    successMessage: "Produto atualizado",
    onSuccess: () => setOpen(false),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setPreviewUrl(imageUrl ?? "");
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
      </DialogContent>
    </Dialog>
  );
}
