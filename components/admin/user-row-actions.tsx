"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reactivateUser } from "@/app/actions/admin/users";
import { DeactivateUserDialog } from "@/components/admin/deactivate-user-dialog";
import { EditUserDialog } from "@/components/admin/edit-user-dialog";
import { ResetPasswordDialog } from "@/components/admin/reset-password-dialog";

export function UserRowActions({
  userId,
  userName,
  courseNumber,
  platoon,
  email,
  role,
  isActive,
}: {
  userId: string;
  userName: string;
  courseNumber: string;
  platoon: string;
  email: string;
  role: "user" | "admin";
  isActive: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function handleReactivate() {
    startTransition(async () => {
      await reactivateUser(userId);
      toast.success("Usuário reativado");
    });
  }

  return (
    <div className="flex justify-end gap-1.5">
      <EditUserDialog
        userId={userId}
        fullName={userName}
        courseNumber={courseNumber}
        platoon={platoon}
        email={email}
        role={role}
      />
      <ResetPasswordDialog userId={userId} userName={userName} />
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
