"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { applyStockAudit } from "@/app/actions/admin/audits";

export function ApplyAuditButton({ auditId }: { auditId: string }) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await applyStockAudit(auditId);
      if (result.error) toast.error(result.error);
      else toast.success("Estoque atualizado com a contagem física");
    });
  }

  return (
    <Button onClick={handleClick} disabled={pending}>
      {pending ? "Aplicando..." : "Aplicar contagem ao estoque"}
    </Button>
  );
}
