import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Refrigerator,
  Receipt,
  Wallet,
  LayoutGrid,
  Boxes,
  Users,
  PackageMinus,
  ScrollText,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export const userNavItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/loja", label: "Geladeiras", icon: Refrigerator },
  { href: "/extrato", label: "Extrato", icon: Receipt },
  { href: "/pagamento", label: "Pagamento", icon: Wallet },
];

export const adminNavItems: NavItem[] = [
  { href: "/admin", label: "Painel", icon: LayoutGrid },
  { href: "/admin/estoque", label: "Estoque", icon: Boxes },
  { href: "/admin/usuarios", label: "Usuários", icon: Users },
  { href: "/admin/pagamentos", label: "Pagamentos", icon: Wallet },
  { href: "/admin/retiradas", label: "Retiradas", icon: PackageMinus },
  { href: "/admin/logs", label: "Logs", icon: ScrollText },
];
