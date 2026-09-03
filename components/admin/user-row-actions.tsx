"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { KeyRound, UserCheck } from "lucide-react";
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
    <div className="flex justify-end gap-1.5">
      <Button
        variant="outline"
        size="icon-sm"
        disabled={pending}
        onClick={handleResetPassword}
        title="Redefinir senha"
        aria-label="Redefinir senha"
      >
        <KeyRound className="h-3.5 w-3.5" />
      </Button>
      {isActive ? (
        <DeactivateUserDialog userId={userId} userName={userName} />
      ) : (
        <Button
          variant="outline"
          size="icon-sm"
          disabled={pending}
          onClick={handleReactivate}
          title="Reativar usuário"
          aria-label="Reativar usuário"
        >
          <UserCheck className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
