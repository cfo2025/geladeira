"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import { createProduct, type ActionResult } from "@/app/actions/admin/catalog";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Package, PackagePlus } from "lucide-react";

export function CreateProductDialog() {
  const [open, setOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(createProduct, {});

  useActionFeedback(state, {
    successMessage: "Produto criado",
    onSuccess: () => {
      setOpen(false);
      setImageUrl("");
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setImageUrl("");
      }}
    >
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="mr-1 h-4 w-4" /> Novo produto
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackagePlus className="h-4 w-4 text-gold" />
            Novo produto
          </DialogTitle>
          <DialogDescription>
            O preço vale para todas as geladeiras. O estoque de cada uma é definido depois, na aba
            Estoque.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted/50 ring-1 ring-border">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt=""
                  fill
                  className="object-contain p-1.5"
                  unoptimized
                  onError={() => setImageUrl("")}
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
                placeholder="https://..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Categoria (opcional)</Label>
            <Input id="category" name="category" placeholder="Ex: Bebida" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Preço</Label>
            <CurrencyInput id="price" name="price" required />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
