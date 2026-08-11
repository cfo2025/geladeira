import { requireUser } from "@/lib/session";
import { AppHeader } from "@/components/app-header";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { userId, profile } = await requireUser();

  const navItems = [
    { href: "/loja", label: "Loja" },
    { href: "/extrato", label: "Extrato" },
    { href: "/pagamento", label: "Pagamento" },
  ];

  if (profile.role === "admin") {
    navItems.push({ href: "/admin", label: "Admin" });
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <AppHeader
        userId={userId}
        fullName={profile.full_name}
        navItems={navItems}
        brand={{ href: "/loja", label: "Loja Honesta" }}
      />
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
