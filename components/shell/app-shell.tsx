import { AppSidebar } from "@/components/shell/app-sidebar";
import { Topbar } from "@/components/shell/topbar";
import { AppFooter } from "@/components/shell/app-footer";

export function AppShell({
  userId,
  fullName,
  role,
  variant,
  children,
}: {
  userId: string;
  fullName: string;
  role: "user" | "admin";
  variant: "app" | "admin";
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-muted/20">
      <AppSidebar role={role} variant={variant} />
      <div className="flex min-h-screen flex-col md:pl-64">
        <Topbar userId={userId} fullName={fullName} role={role} variant={variant} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8">{children}</main>
        <AppFooter />
      </div>
    </div>
  );
}
