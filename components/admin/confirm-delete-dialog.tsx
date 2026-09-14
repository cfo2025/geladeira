"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Trash2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { ActionResult } from "@/app/actions/admin/catalog";

export function ConfirmDeleteDialog({
  title,
  description,
  confirmLabel = "Excluir",
  action,
  disabled = false,
  disabledReason,
  logged = false,
}: {
  title: string;
  description: string;
  confirmLabel?: string;
  action: () => Promise<ActionResult>;
  disabled?: boolean;
  disabledReason?: string;
  /** Mostra o aviso de que a ação fica registrada nos Logs, além de ser irreversível. */
  logged?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Excluído com sucesso");
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            size="icon-sm"
            variant="ghost"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={disabled}
            title={disabled ? disabledReason : confirmLabel}
            aria-label={confirmLabel}
          />
        }
      >
        <Trash2 className="h-3.5 w-3.5" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>
            Esta ação não pode ser desfeita.
            {logged && " Fica registrado nos Logs."}
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={pending}>
            {pending ? "Excluindo..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
