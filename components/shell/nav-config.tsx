import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Store,
  Receipt,
  Wallet,
  LayoutGrid,
  Package,
  MapPin,
  Boxes,
  Users,
  PackageMinus,
  ClipboardCheck,
  ScrollText,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export const userNavItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/loja", label: "Loja", icon: Store },
  { href: "/extrato", label: "Extrato", icon: Receipt },
  { href: "/pagamento", label: "Pagamento", icon: Wallet },
];

export const adminNavItems: NavItem[] = [
  { href: "/admin", label: "Painel", icon: LayoutGrid },
  { href: "/admin/produtos", label: "Produtos", icon: Package },
  { href: "/admin/locais", label: "Locais", icon: MapPin },
  { href: "/admin/estoque", label: "Estoque", icon: Boxes },
  { href: "/admin/usuarios", label: "Usuários", icon: Users },
  { href: "/admin/pagamentos", label: "Pagamentos", icon: Wallet },
  { href: "/admin/retiradas", label: "Retiradas", icon: PackageMinus },
  { href: "/admin/auditoria", label: "Auditoria", icon: ClipboardCheck },
  { href: "/admin/logs", label: "Logs", icon: ScrollText },
];
