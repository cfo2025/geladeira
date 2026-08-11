"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { toggleProductActive } from "@/app/actions/admin/catalog";

export function ProductActiveSwitch({ id, isActive }: { id: string; isActive: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <Switch
      checked={isActive}
      disabled={pending}
      onCheckedChange={(checked) => {
        startTransition(async () => {
          await toggleProductActive(id, checked);
          toast.success(checked ? "Produto ativado" : "Produto desativado");
        });
      }}
    />
  );
}
