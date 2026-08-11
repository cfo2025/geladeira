export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function formatDateTime(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function formatDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(date);
}

export const DEACTIVATION_REASON_LABELS: Record<string, string> = {
  desligamento: "Desligamento",
  "pedido de baixa": "Pedido de baixa",
  "a pedido": "A pedido",
  dever: "Dever",
};

export const WITHDRAWAL_STATUS_LABELS: Record<string, string> = {
  completed: "Concluída",
  deletion_requested: "Cancelamento solicitado",
  cancelled: "Cancelada",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Em análise",
  approved: "Aprovado",
  rejected_divergent: "Divergência encontrada",
  rejected_unpaid: "Não identificado",
};

export const CANCELLATION_STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  approved: "Aprovada",
  rejected: "Rejeitada",
};
