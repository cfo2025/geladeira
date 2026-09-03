import { createAdminClient } from "@/lib/supabase/admin";
import { UsersTable } from "@/components/admin/users-table";

export default async function AdminUsuariosPage() {
  const admin = createAdminClient();

  const [{ data: authUsers }, { data: profiles }] = await Promise.all([
    admin.auth.admin.listUsers({ perPage: 1000 }),
    admin.from("profiles").select("*").order("created_at", { ascending: false }),
  ]);

  const emailById = new Map(authUsers?.users.map((u) => [u.id, u.email]) ?? []);

  const users = (profiles ?? []).map((profile) => ({
    ...profile,
    email: emailById.get(profile.id) ?? "—",
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Usuários</h1>
        <p className="text-muted-foreground">Gerencie contas, acessos e desativações.</p>
      </div>

      <UsersTable users={users} />
    </div>
  );
}
