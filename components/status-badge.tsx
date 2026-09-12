import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  CANCELLATION_STATUS_LABELS,
  EXPENSE_TAG_LABELS,
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

/** Empenho = saída normal/planejada. Bônus = gratificação. Descaminho =
 *  prejuízo (sumiço/furto não lançado como retirada) — destacado em
 *  vermelho pra ficar bem visível que é uma perda, não um gasto normal. */
export function ExpenseTagBadge({ tag }: { tag: string }) {
  if (tag === "descaminho") {
    return <Badge variant="destructive">{EXPENSE_TAG_LABELS[tag]}</Badge>;
  }
  if (tag === "bonus") {
    return (
      <Badge
        className={cn(
          "border-transparent bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400"
        )}
      >
        {EXPENSE_TAG_LABELS[tag]}
      </Badge>
    );
  }
  return <Badge variant="secondary">{EXPENSE_TAG_LABELS[tag] ?? tag}</Badge>;
}
