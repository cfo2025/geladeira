import { TopNavbar } from "@/components/shell/top-navbar";
import { SecondaryNav } from "@/components/shell/secondary-nav";
import { AppFooter } from "@/components/shell/app-footer";

export function AppShell({
  userId,
  fullName,
  role,
  children,
}: {
  userId: string;
  fullName: string;
  role: "user" | "admin";
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <TopNavbar userId={userId} fullName={fullName} />
      <SecondaryNav role={role} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8">{children}</main>
      <AppFooter />
    </div>
  );
}
