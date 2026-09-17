import { requireExpenseOrderer } from "@/lib/session";
import { AppShell } from "@/components/shell/app-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Admin entra em tudo; ordenador de despesa só passa daqui porque
  // middleware.ts já restringiu quais rotas /admin/* ele pode acessar
  // (pagamentos/retiradas/auditoria) — as demais páginas se protegem de
  // novo com requireAdmin() individualmente.
  const { userId, profile } = await requireExpenseOrderer();

  return (
    <AppShell userId={userId} fullName={profile.full_name} role={profile.role}>
      {children}
    </AppShell>
  );
}
