"use client";

import { useActionState, useState } from "react";
import { deactivateUser, type ActionResult } from "@/app/actions/admin/users";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DEACTIVATION_REASON_LABELS } from "@/lib/format";
import { UserX } from "lucide-react";

export function DeactivateUserDialog({ userId, userName }: { userId: string; userName: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("desligamento");
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(deactivateUser, {});

  useActionFeedback(state, {
    successMessage: "Usuário desativado",
    onSuccess: () => setOpen(false),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="icon-sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            title="Desativar usuário"
            aria-label="Desativar usuário"
          />
        }
      >
        <UserX className="h-3.5 w-3.5" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Desativar {userName}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="userId" value={userId} />
          <input type="hidden" name="reason" value={reason} />
          <div className="space-y-2">
            <Label>Motivo</Label>
            <Select value={reason} onValueChange={(value) => setReason(value ?? "desligamento")}>
              <SelectTrigger>
                <SelectValue>
                  {(value: string) => DEACTIVATION_REASON_LABELS[value]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DEACTIVATION_REASON_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? "Desativando..." : "Confirmar desativação"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
