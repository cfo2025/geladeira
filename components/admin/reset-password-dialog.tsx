"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";
import { resetUserPassword } from "@/app/actions/admin/users";
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

export function ResetPasswordDialog({ userId, userName }: { userId: string; userName: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      const result = await resetUserPassword(userId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Senha redefinida e enviada por e-mail");
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="icon-sm"
            title="Redefinir senha"
            aria-label="Redefinir senha"
          />
        }
      >
        <KeyRound className="h-3.5 w-3.5" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Redefinir senha de {userName}</DialogTitle>
          <DialogDescription>
            Uma nova senha temporária será gerada e enviada por e-mail. A senha atual deixa de
            funcionar imediatamente.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={pending}>
            {pending ? "Enviando..." : "Confirmar redefinição"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
