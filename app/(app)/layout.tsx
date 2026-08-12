import { requireUser } from "@/lib/session";
import { AppShell } from "@/components/shell/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { userId, profile } = await requireUser();

  return (
    <AppShell userId={userId} fullName={profile.full_name} role={profile.role}>
      {children}
    </AppShell>
  );
}
