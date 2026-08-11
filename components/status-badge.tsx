import { Badge } from "@/components/ui/badge";
import {
  CANCELLATION_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  WITHDRAWAL_STATUS_LABELS,
} from "@/lib/format";

const POSITIVE = new Set(["completed", "approved"]);
const NEGATIVE = new Set(["cancelled", "rejected", "rejected_divergent", "rejected_unpaid"]);

function variantFor(status: string): "default" | "secondary" | "destructive" {
  if (POSITIVE.has(status)) return "default";
  if (NEGATIVE.has(status)) return "destructive";
  return "secondary";
}

export function WithdrawalStatusBadge({ status }: { status: string }) {
  return <Badge variant={variantFor(status)}>{WITHDRAWAL_STATUS_LABELS[status] ?? status}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: string }) {
  return <Badge variant={variantFor(status)}>{PAYMENT_STATUS_LABELS[status] ?? status}</Badge>;
}

export function CancellationStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={variantFor(status)}>{CANCELLATION_STATUS_LABELS[status] ?? status}</Badge>
  );
}
