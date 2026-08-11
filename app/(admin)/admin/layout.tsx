import { requireAdmin } from "@/lib/session";
import { AppHeader } from "@/components/app-header";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId, profile } = await requireAdmin();

  const navItems = [
    { href: "/admin", label: "Painel" },
    { href: "/admin/produtos", label: "Produtos" },
    { href: "/admin/locais", label: "Locais" },
    { href: "/admin/estoque", label: "Estoque" },
    { href: "/admin/usuarios", label: "Usuários" },
    { href: "/admin/pagamentos", label: "Pagamentos" },
    { href: "/admin/retiradas", label: "Retiradas" },
    { href: "/admin/auditoria", label: "Auditoria" },
    { href: "/admin/logs", label: "Logs" },
    { href: "/loja", label: "Ir para a loja" },
  ];

  return (
    <div className="min-h-screen bg-muted/20">
      <AppHeader
        userId={userId}
        fullName={profile.full_name}
        navItems={navItems}
        brand={{ href: "/admin", label: "Loja Honesta · Admin" }}
      />
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
