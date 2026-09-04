"use client";

import { useActionState, useState } from "react";
import { updateUser, type ActionResult } from "@/app/actions/admin/users";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil } from "lucide-react";

export function EditUserDialog({
  userId,
  fullName,
  courseNumber,
  platoon,
  email,
  role,
}: {
  userId: string;
  fullName: string;
  courseNumber: string;
  platoon: string;
  email: string;
  role: "user" | "admin";
}) {
  const [open, setOpen] = useState(false);
  const [roleValue, setRoleValue] = useState(role);
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(updateUser, {});

  useActionFeedback(state, {
    successMessage: "Usuário atualizado",
    onSuccess: () => setOpen(false),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setRoleValue(role);
      }}
    >
      <DialogTrigger
        render={<Button variant="ghost" size="icon-sm" title="Editar usuário" aria-label="Editar usuário" />}
      >
        <Pencil className="h-3.5 w-3.5" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-4 w-4 text-gold" />
            Editar usuário
          </DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="userId" value={userId} />
          <input type="hidden" name="role" value={roleValue} />
          <div className="space-y-2">
            <Label htmlFor="fullName">Nome de guerra</Label>
            <Input id="fullName" name="fullName" defaultValue={fullName} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="courseNumber">Nº de curso</Label>
              <Input id="courseNumber" name="courseNumber" defaultValue={courseNumber} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="platoon">Pelotão</Label>
              <Input id="platoon" name="platoon" defaultValue={platoon} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" defaultValue={email} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Perfil</Label>
            <Select value={roleValue} onValueChange={(value) => setRoleValue((value as "user" | "admin") ?? "user")}>
              <SelectTrigger id="role">
                <SelectValue>
                  {(value: string) => (value === "admin" ? "Administrador" : "Usuário")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Usuário</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : "Salvar alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
