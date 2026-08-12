import Link from "next/link";
import { signOut } from "@/app/actions/auth";

export function AppFooter({ role }: { role: "user" | "admin" }) {
  const links = [
    { label: "Gestão de Conta", href: "/perfil" },
    { label: "Relatórios", href: role === "admin" ? "/admin/pagamentos" : "/extrato" },
    { label: "Inventário", href: role === "admin" ? "/admin/estoque" : "/loja" },
    { label: "Suporte", href: "mailto:suporte@cfotucumxvii.com.br" },
  ];

  return (
    <footer className="border-t bg-background">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-5 text-sm text-muted-foreground sm:flex-row md:px-8">
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          {links.map((link) => (
            <Link key={link.label} href={link.href} className="hover:text-foreground">
              {link.label}
            </Link>
          ))}
          <form action={signOut}>
            <button type="submit" className="hover:text-foreground">
              Logout
            </button>
          </form>
        </nav>
        <p className="text-xs text-muted-foreground/70">Versão do Sistema &middot; v1.0</p>
      </div>
    </footer>
  );
}
