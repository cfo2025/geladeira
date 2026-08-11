import { SidebarNavContent } from "@/components/shell/sidebar-nav-content";

export function AppSidebar({ role, variant }: { role: "user" | "admin"; variant: "app" | "admin" }) {
  return (
    <aside className="fixed inset-y-0 left-0 hidden w-64 shrink-0 bg-sidebar md:flex">
      <SidebarNavContent role={role} variant={variant} />
    </aside>
  );
}
