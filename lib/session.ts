import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export async function getCurrentProfile(): Promise<{
  userId: string;
  email: string | undefined;
  profile: Profile;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return { userId: user.id, email: user.email, profile };
}

export async function requireUser() {
  const session = await getCurrentProfile();
  if (!session) redirect("/login");
  return session;
}

export async function requireAdmin() {
  const session = await requireUser();
  if (session.profile.role !== "admin") redirect("/dashboard");
  return session;
}
