"use client";

import { useEffect, useState } from "react";
import { markDivergenceSeen } from "@/app/actions/payments";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

export function DivergenceCard({
  paymentId,
  notes,
  notifiedAt,
}: {
  paymentId: string;
  notes: string | null;
  notifiedAt: string | null;
}) {
  const [seenAt, setSeenAt] = useState(notifiedAt);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    if (!notifiedAt) {
      markDivergenceSeen(paymentId).then(() => setSeenAt(new Date().toISOString()));
    }
  }, [notifiedAt, paymentId]);

  useEffect(() => {
    const timeout = setTimeout(() => setNow(Date.now()), 0);
    return () => clearTimeout(timeout);
  }, []);

  const deadline = seenAt ? new Date(new Date(seenAt).getTime() + FIVE_DAYS_MS) : null;
  const daysLeft =
    deadline && now !== null
      ? Math.max(0, Math.ceil((deadline.getTime() - now) / (24 * 60 * 60 * 1000)))
      : null;

  return (
    <Alert variant="destructive">
      <AlertTitle>Divergência identificada</AlertTitle>
      <AlertDescription className="space-y-1">
        {notes && <p>{notes}</p>}
        <p>Procure a administração para regularizar sua situação.</p>
        {daysLeft !== null && (
          <p className="font-medium">
            {daysLeft > 0
              ? `Prazo de ${daysLeft} dia(s) restante(s) para regularização.`
              : "O prazo de regularização expirou."}
          </p>
        )}
      </AlertDescription>
    </Alert>
  );
}
