"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/session";
import { generateTempPassword, logAdminAction } from "@/lib/audit";
import { sendWelcomeEmail } from "@/lib/email";
import type { DeactivationReason } from "@/lib/database.types";

export type ActionResult = { error?: string; success?: boolean };

const createUserSchema = z.object({
  fullName: z.string().min(2, "Nome de guerra muito curto"),
  courseNumber: z.string().min(1, "Informe o número do curso"),
  platoon: z.string().min(1, "Informe o pelotão"),
  email: z.string().email("E-mail inválido"),
  role: z.enum(["user", "admin"]),
});

export async function createUser(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const { userId: actorId } = await requireAdmin();

  const parsed = createUserSchema.safeParse({
    fullName: formData.get("fullName"),
    courseNumber: formData.get("courseNumber"),
    platoon: formData.get("platoon"),
    email: formData.get("email"),
    role: formData.get("role") || "user",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const admin = createAdminClient();
  const tempPassword = generateTempPassword();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: tempPassword,
    email_confirm: true,
  });

  if (createError || !created.user) {
    return { error: createError?.message ?? "Não foi possível criar o usuário" };
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: created.user.id,
    full_name: parsed.data.fullName,
    course_number: parsed.data.courseNumber,
    platoon: parsed.data.platoon,
    role: parsed.data.role,
    must_change_password: true,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return { error: profileError.message };
  }

  await logAdminAction(actorId, created.user.id, "user_created", { email: parsed.data.email });
  await sendWelcomeEmail(parsed.data.email, parsed.data.fullName, tempPassword);

  revalidatePath("/admin/usuarios");
  return { success: true };
}

const updateUserSchema = z.object({
  userId: z.string().uuid(),
  fullName: z.string().min(2, "Nome de guerra muito curto"),
  courseNumber: z.string().min(1, "Informe o número do curso"),
  platoon: z.string().min(1, "Informe o pelotão"),
  email: z.string().email("E-mail inválido"),
  role: z.enum(["user", "admin"]),
});

export async function updateUser(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const { userId: actorId } = await requireAdmin();

  const parsed = updateUserSchema.safeParse({
    userId: formData.get("userId"),
    fullName: formData.get("fullName"),
    courseNumber: formData.get("courseNumber"),
    platoon: formData.get("platoon"),
    email: formData.get("email"),
    role: formData.get("role") || "user",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const admin = createAdminClient();

  const { data: current, error: getUserError } = await admin.auth.admin.getUserById(
    parsed.data.userId
  );
  if (getUserError || !current.user) {
    return { error: "Usuário não encontrado" };
  }

  if (current.user.email !== parsed.data.email) {
    const { error: emailError } = await admin.auth.admin.updateUserById(parsed.data.userId, {
      email: parsed.data.email,
      email_confirm: true,
    });
    if (emailError) {
      return {
        error:
          emailError.code === "email_exists"
            ? "Já existe um usuário com este e-mail"
            : emailError.message,
      };
    }
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      course_number: parsed.data.courseNumber,
      platoon: parsed.data.platoon,
      role: parsed.data.role,
    })
    .eq("id", parsed.data.userId);
  if (profileError) return { error: profileError.message };

  await logAdminAction(actorId, parsed.data.userId, "user_updated", { email: parsed.data.email });

  revalidatePath("/admin/usuarios");
  return { success: true };
}

const deactivateSchema = z.object({
  userId: z.string().uuid(),
  reason: z.enum(["desligamento", "pedido de baixa", "a pedido", "dever"]),
});

export async function deactivateUser(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const { userId: actorId } = await requireAdmin();

  const parsed = deactivateSchema.safeParse({
    userId: formData.get("userId"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      is_active: false,
      deactivation_reason: parsed.data.reason as DeactivationReason,
    })
    .eq("id", parsed.data.userId);

  if (error) return { error: error.message };

  await logAdminAction(actorId, parsed.data.userId, "user_deactivated", {
    reason: parsed.data.reason,
  });

  revalidatePath("/admin/usuarios");
  return { success: true };
}

export async function reactivateUser(userId: string) {
  const { userId: actorId } = await requireAdmin();
  const supabase = await createClient();
  await supabase
    .from("profiles")
    .update({ is_active: true, deactivation_reason: null })
    .eq("id", userId);

  await logAdminAction(actorId, userId, "user_reactivated");
  revalidatePath("/admin/usuarios");
}

export async function resetUserPassword(userId: string): Promise<ActionResult> {
  const { userId: actorId } = await requireAdmin();

  const admin = createAdminClient();
  const { data: userData, error: getUserError } = await admin.auth.admin.getUserById(userId);
  if (getUserError || !userData.user?.email) {
    return { error: "Usuário não encontrado" };
  }

  const tempPassword = generateTempPassword();
  const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
    password: tempPassword,
  });
  if (updateError) return { error: updateError.message };

  await admin.from("profiles").update({ must_change_password: true }).eq("id", userId);

  const { data: profile } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .single();

  await logAdminAction(actorId, userId, "password_reset");
  await sendWelcomeEmail(userData.user.email, profile?.full_name ?? "", tempPassword);

  revalidatePath("/admin/usuarios");
  return { success: true };
}
