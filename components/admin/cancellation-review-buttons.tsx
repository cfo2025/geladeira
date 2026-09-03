"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { reviewCancellationRequest } from "@/app/actions/admin/cancellations";

export function CancellationReviewButtons({ requestId }: { requestId: string }) {
  const [pending, startTransition] = useTransition();

  function handle(approve: boolean) {
    startTransition(async () => {
      const result = await reviewCancellationRequest(requestId, approve);
      if (result.error) toast.error(result.error);
      else toast.success(approve ? "Cancelamento aprovado" : "Cancelamento rejeitado");
    });
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" className="flex-1" disabled={pending} onClick={() => handle(false)}>
        Rejeitar
      </Button>
      <Button size="sm" className="flex-1" disabled={pending} onClick={() => handle(true)}>
        Aprovar
      </Button>
    </div>
  );
}
