import type { LucideIcon } from "lucide-react";
import {
  UserPlus,
  UserX,
  UserCheck,
  KeyRound,
  Undo2,
  CheckCircle2,
  XCircle,
  Wallet,
  ClipboardList,
  PackagePlus,
  ArrowLeftRight,
  Trash2,
  BadgePercent,
  Eraser,
  FileQuestion,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { DEACTIVATION_REASON_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/format";

export type LogTone = "green" | "red" | "blue" | "amber" | "slate";

export type LogChip = { label: string; value: string };

export type LogPresentation = {
  icon: LucideIcon;
  tone: LogTone;
  title: string;
  description: string;
  chips: LogChip[];
  auditId?: string;
};

export const TONE_CLASSES: Record<LogTone, { bg: string; text: string }> = {
  green: { bg: "bg-green-100 dark:bg-green-500/15", text: "text-green-700 dark:text-green-400" },
  red: { bg: "bg-destructive/10", text: "text-destructive" },
  blue: { bg: "bg-blue-100 dark:bg-blue-500/15", text: "text-blue-700 dark:text-blue-400" },
  amber: { bg: "bg-amber-100 dark:bg-amber-500/15", text: "text-amber-700 dark:text-amber-400" },
  slate: { bg: "bg-muted", text: "text-muted-foreground" },
};

type Details = Record<string, unknown> | null;

function str(details: Details, key: string): string | undefined {
  const value = details?.[key];
  return typeof value === "string" ? value : undefined;
}

function num(details: Details, key: string): number | undefined {
  const value = details?.[key];
  return typeof value === "number" ? value : undefined;
}

export function getLogPresentation(
  action: string,
  details: Details,
  ctx: {
    actorName: string;
    targetName: string;
    products: Record<string, string>;
    locations: Record<string, string>;
  }
): LogPresentation {
  const { actorName, targetName } = ctx;
  const productName = (id: string | undefined) => (id && ctx.products[id]) || "Produto removido";
  const locationName = (id: string | undefined) => (id && ctx.locations[id]) || "Local removido";

  switch (action) {
    case "user_created":
      return {
        icon: UserPlus,
        tone: "green",
        title: "Usuário criado",
        description: `${actorName} criou o usuário ${targetName}.`,
        chips: str(details, "email") ? [{ label: "E-mail", value: str(details, "email")! }] : [],
      };
    case "user_deactivated": {
      const reason = str(details, "reason");
      return {
        icon: UserX,
        tone: "red",
        title: "Usuário desativado",
        description: `${actorName} desativou ${targetName}.`,
        chips: reason ? [{ label: "Motivo", value: DEACTIVATION_REASON_LABELS[reason] ?? reason }] : [],
      };
    }
    case "user_reactivated":
      return {
        icon: UserCheck,
        tone: "green",
        title: "Usuário reativado",
        description: `${actorName} reativou ${targetName}.`,
        chips: [],
      };
    case "password_reset":
      return {
        icon: KeyRound,
        tone: "blue",
        title: "Senha redefinida",
        description: `${actorName} redefiniu a senha de ${targetName}.`,
        chips: [],
      };
    case "cancellation_requested":
      return {
        icon: Undo2,
        tone: "amber",
        title: "Cancelamento solicitado",
        description: `${actorName} solicitou o cancelamento de uma retirada.`,
        chips: [],
      };
    case "cancellation_reviewed": {
      const approved = details?.approved === true;
      return {
        icon: approved ? CheckCircle2 : XCircle,
        tone: approved ? "green" : "red",
        title: approved ? "Cancelamento aprovado" : "Cancelamento rejeitado",
        description: `${actorName} ${approved ? "aprovou" : "rejeitou"} o cancelamento solicitado por ${targetName}.`,
        chips: [],
      };
    }
    case "payment_reviewed": {
      const decision = str(details, "decision") ?? "";
      const approved = decision === "approved";
      const amount = num(details, "admin_typed_amount");
      return {
        icon: Wallet,
        tone: approved ? "green" : "red",
        title: "Pagamento revisado",
        description: `${actorName} revisou o pagamento de ${targetName}: ${PAYMENT_STATUS_LABELS[decision] ?? decision}.`,
        chips: amount !== undefined ? [{ label: "Valor conferido", value: formatCurrency(amount) }] : [],
      };
    }
    case "stock_audit_created":
      return {
        icon: ClipboardList,
        tone: "amber",
        title: "Balanço de estoque criado",
        description: `${actorName} criou um balanço de estoque em ${locationName(str(details, "location_id"))}.`,
        chips: [],
        auditId: str(details, "audit_id"),
      };
    case "stock_audit_applied":
      return {
        icon: CheckCircle2,
        tone: "green",
        title: "Balanço aplicado ao estoque",
        description: `${actorName} aplicou a contagem física do balanço ao estoque.`,
        chips: [],
        auditId: str(details, "audit_id"),
      };
    case "stock_audit_item_applied":
      return {
        icon: Eraser,
        tone: "green",
        title: "Ajuste de balanço aplicado",
        description: `${actorName} aplicou o ajuste de um item do balanço ao estoque.`,
        chips: [],
      };
    case "stock_restock": {
      const quantity = num(details, "quantity");
      const notes = str(details, "notes");
      return {
        icon: PackagePlus,
        tone: "green",
        title: "Reposição de estoque",
        description: `${actorName} repôs estoque de ${productName(str(details, "product_id"))} em ${locationName(str(details, "location_id"))}.`,
        chips: [
          ...(quantity !== undefined ? [{ label: "Quantidade", value: `+${quantity}` }] : []),
          ...(notes ? [{ label: "Observação", value: notes }] : []),
        ],
      };
    }
    case "stock_transfer": {
      const quantity = num(details, "quantity");
      return {
        icon: ArrowLeftRight,
        tone: "blue",
        title: "Transferência entre geladeiras",
        description: `${actorName} transferiu ${productName(str(details, "product_id"))} de ${locationName(str(details, "from_location_id"))} para ${locationName(str(details, "to_location_id"))}.`,
        chips: quantity !== undefined ? [{ label: "Quantidade", value: String(quantity) }] : [],
      };
    }
    case "location_deleted":
      return {
        icon: Trash2,
        tone: "red",
        title: "Local excluído",
        description: `${actorName} excluiu um local.`,
        chips: [{ label: "Local", value: locationName(str(details, "location_id")) }],
      };
    case "product_deleted":
      return {
        icon: Trash2,
        tone: "red",
        title: "Produto excluído",
        description: `${actorName} excluiu um produto.`,
        chips: [{ label: "Produto", value: productName(str(details, "product_id")) }],
      };
    case "promo_set": {
      const price = num(details, "price");
      const promoPrice = num(details, "promo_price");
      const discount =
        price && promoPrice ? `${Math.round((1 - promoPrice / price) * 100)}%` : undefined;
      return {
        icon: BadgePercent,
        tone: "amber",
        title: "Promoção criada",
        description: `${actorName} criou uma promoção para ${productName(str(details, "product_id"))}.`,
        chips: [
          ...(price !== undefined ? [{ label: "Preço", value: formatCurrency(price) }] : []),
          ...(promoPrice !== undefined ? [{ label: "Promocional", value: formatCurrency(promoPrice) }] : []),
          ...(discount ? [{ label: "Desconto", value: `−${discount}` }] : []),
        ],
      };
    }
    case "promo_cleared":
      return {
        icon: BadgePercent,
        tone: "slate",
        title: "Promoção removida",
        description: `${actorName} removeu a promoção de ${productName(str(details, "product_id"))}.`,
        chips: [],
      };
    default:
      return {
        icon: FileQuestion,
        tone: "slate",
        title: action,
        description: `${actorName} realizou a ação "${action}".`,
        chips: Object.entries(details ?? {}).map(([key, value]) => ({
          label: key,
          value: String(value),
        })),
      };
  }
}
