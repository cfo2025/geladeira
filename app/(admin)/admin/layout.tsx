import { requireAdmin } from "@/lib/session";
import { AppShell } from "@/components/shell/app-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId, profile } = await requireAdmin();

  return (
    <AppShell userId={userId} fullName={profile.full_name} role={profile.role} variant="admin">
      {children}
    </AppShell>
  );
}
