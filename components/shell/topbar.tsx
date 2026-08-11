import { createClient } from "@/lib/supabase/server";
import { NotificationsBell } from "@/components/notifications-bell";
import { UserMenu } from "@/components/user-menu";
import { MobileSidebar } from "@/components/shell/mobile-sidebar";

export async function Topbar({
  userId,
  fullName,
  role,
  variant,
  title,
}: {
  userId: string;
  fullName: string;
  role: "user" | "admin";
  variant: "app" | "admin";
  title?: string;
}) {
  const supabase = await createClient();
  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, title, message, is_read, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur md:px-8">
      <MobileSidebar role={role} variant={variant} />
      <div className="flex-1">
        {title && <h2 className="font-heading text-base font-semibold">{title}</h2>}
      </div>
      <div className="flex items-center gap-1">
        <NotificationsBell initialNotifications={notifications ?? []} userId={userId} />
        <UserMenu fullName={fullName} />
      </div>
    </header>
  );
}
