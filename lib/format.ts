export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

const BR_TIME_ZONE = "America/Sao_Paulo";

export function formatDateTime(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: BR_TIME_ZONE,
  }).format(date);
}

export function formatDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: BR_TIME_ZONE }).format(date);
}

/** "DD/MM/AAAA às HH:mm", pro extrato de prestação de contas da Transparência. */
export function formatDateTimeFull(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const datePart = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: BR_TIME_ZONE,
  }).format(date);
  const timePart = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: BR_TIME_ZONE,
  }).format(date);
  return `${datePart} às ${timePart}`;
}

export const ROLE_LABELS: Record<string, string> = {
  user: "Usuário",
  admin: "Administrador",
  ordenador_despesa: "Ordenador de despesa",
};

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
