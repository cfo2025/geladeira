"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { deactivateLocation, reactivateLocation } from "@/app/actions/admin/catalog";

export function LocationActiveSwitch({ id, isActive }: { id: string; isActive: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <Switch
      checked={isActive}
      disabled={pending}
      onCheckedChange={(checked) => {
        startTransition(async () => {
          const result = checked ? await reactivateLocation(id) : await deactivateLocation(id);
          if (result.error) {
            toast.error(result.error);
            return;
          }
          toast.success(checked ? "Local reativado" : "Local desativado");
        });
      }}
    />
  );
}
