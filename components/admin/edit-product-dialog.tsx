"use client";

import { useActionState, useState } from "react";
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
import { Pencil } from "lucide-react";

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
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(updateProduct, {});

  useActionFeedback(state, {
    successMessage: "Produto atualizado",
    onSuccess: () => setOpen(false),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="icon" variant="ghost" />}>
        <Pencil className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar produto</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="id" value={id} />
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" defaultValue={name} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Categoria (opcional)</Label>
            <Input id="category" name="category" defaultValue={category ?? ""} placeholder="Ex: Bebida" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="image_url">URL da foto (opcional)</Label>
            <Input
              id="image_url"
              name="image_url"
              type="url"
              defaultValue={imageUrl ?? ""}
              placeholder="https://..."
            />
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
