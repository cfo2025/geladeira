import { createClient } from "@/lib/supabase/server";
import { NotificationsBell } from "@/components/notifications-bell";
import { UserMenu } from "@/components/user-menu";
import { SearchInput } from "@/components/shell/search-input";
import { BrandMark } from "@/components/shell/brand-mark";
import { QuickWithdrawDialog } from "@/components/quick-withdraw-dialog";

export async function TopNavbar({ userId, fullName }: { userId: string; fullName: string }) {
  const supabase = await createClient();
  const [{ data: notifications }, { data: locations }, { data: inventory }] = await Promise.all([
    supabase
      .from("notifications")
      .select("id, title, message, is_read, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase.from("locations").select("id, name").order("name"),
    supabase
      .from("inventory")
      .select("id, location_id, price, quantity, product:products!inner(id, name, is_active)")
      .eq("product.is_active", true),
  ]);

  return (
    <header className="sticky top-0 z-30 h-16 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 md:px-8">
        <BrandMark tone="light" className="shrink-0" />
        <div className="flex flex-1 justify-center px-4">
          <SearchInput />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <NotificationsBell initialNotifications={notifications ?? []} userId={userId} />
          <QuickWithdrawDialog
            locations={locations ?? []}
            inventory={inventory ?? []}
            size="sm"
            className="hidden sm:inline-flex"
          />
          <UserMenu fullName={fullName} />
        </div>
      </div>
    </header>
  );
}
