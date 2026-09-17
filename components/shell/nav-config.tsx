import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Refrigerator,
  Receipt,
  Wallet,
  Landmark,
  LayoutGrid,
  Boxes,
  Users,
  PackageMinus,
  ScrollText,
} from "lucide-react";
import type { UserRole } from "@/lib/database.types";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Quem vê esse item no menu Administração. Sem isso, é só admin. */
  roles?: UserRole[];
};

export const userNavItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/loja", label: "Geladeiras", icon: Refrigerator },
  { href: "/extrato", label: "Extrato", icon: Receipt },
  { href: "/pagamento", label: "Pagamento", icon: Wallet },
];

/** Visível pra qualquer usuário logado — fica entre Pagamento e Administração. */
export const transparenciaNavItem: NavItem = {
  href: "/transparencia",
  label: "Transparência",
  icon: Landmark,
};

export const adminNavItems: NavItem[] = [
  { href: "/admin", label: "Painel", icon: LayoutGrid, roles: ["admin"] },
  { href: "/admin/estoque", label: "Estoque", icon: Boxes, roles: ["admin"] },
  { href: "/admin/usuarios", label: "Usuários", icon: Users, roles: ["admin"] },
  { href: "/admin/pagamentos", label: "Pagamentos", icon: Wallet, roles: ["admin", "ordenador_despesa"] },
  { href: "/admin/retiradas", label: "Retiradas", icon: PackageMinus, roles: ["admin", "ordenador_despesa"] },
  { href: "/admin/logs", label: "Logs", icon: ScrollText, roles: ["admin"] },
];
