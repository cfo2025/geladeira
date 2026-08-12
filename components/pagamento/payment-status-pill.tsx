import { Clock, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
  pending: {
    label: "Em Análise",
    icon: Clock,
    className: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  },
  approved: {
    label: "Aprovado",
    icon: CheckCircle2,
    className: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
  },
  rejected_divergent: {
    label: "Divergente",
    icon: AlertTriangle,
    className: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400",
  },
  rejected_unpaid: {
    label: "Não Confirmado",
    icon: XCircle,
    className: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
  },
} as const;

export function PaymentStatusPill({ status }: { status: string }) {
  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
  if (!config) return <span className="text-xs text-muted-foreground">{status}</span>;

  const Icon = config.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        config.className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}
