"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { reactivateUser, resetUserPassword } from "@/app/actions/admin/users";
import { DeactivateUserDialog } from "@/components/admin/deactivate-user-dialog";

export function UserRowActions({
  userId,
  userName,
  isActive,
}: {
  userId: string;
  userName: string;
  isActive: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function handleReactivate() {
    startTransition(async () => {
      await reactivateUser(userId);
      toast.success("Usuário reativado");
    });
  }

  function handleResetPassword() {
    startTransition(async () => {
      const result = await resetUserPassword(userId);
      if (result.error) toast.error(result.error);
      else toast.success("Senha redefinida e enviada por e-mail");
    });
  }

  return (
    <div className="flex justify-end gap-2">
      <Button variant="ghost" size="sm" disabled={pending} onClick={handleResetPassword}>
        Redefinir senha
      </Button>
      {isActive ? (
        <DeactivateUserDialog userId={userId} userName={userName} />
      ) : (
        <Button variant="outline" size="sm" disabled={pending} onClick={handleReactivate}>
          Reativar
        </Button>
      )}
    </div>
  );
}
