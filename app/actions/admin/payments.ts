"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/session";
import { sendPaymentReviewedEmail } from "@/lib/email";

export type ActionResult = { error?: string; success?: boolean };

const reviewSchema = z.object({
  paymentId: z.string().uuid(),
  adminTypedAmount: z.coerce.number().min(0, "Valor inválido"),
  decision: z.enum(["approved", "rejected_divergent", "rejected_unpaid"]),
  notes: z.string().max(1000).optional(),
});

export async function reviewPayment(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = reviewSchema.safeParse({
    paymentId: formData.get("paymentId"),
    adminTypedAmount: formData.get("adminTypedAmount"),
    decision: formData.get("decision"),
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { data: payment } = await supabase
    .from("payments")
    .select("user_id")
    .eq("id", parsed.data.paymentId)
    .single();

  const { error } = await supabase.rpc("review_payment", {
    p_payment_id: parsed.data.paymentId,
    p_admin_typed_amount: parsed.data.adminTypedAmount,
    p_decision: parsed.data.decision,
    p_notes: parsed.data.notes ?? null,
  });

  if (error) return { error: error.message };

  if (payment?.user_id) {
    const admin = createAdminClient();
    const [{ data: userData }, { data: profile }] = await Promise.all([
      admin.auth.admin.getUserById(payment.user_id),
      admin.from("profiles").select("full_name").eq("id", payment.user_id).single(),
    ]);
    if (userData.user?.email) {
      await sendPaymentReviewedEmail(
        userData.user.email,
        profile?.full_name ?? "",
        parsed.data.decision,
        parsed.data.notes
      );
    }
  }

  revalidatePath("/admin/pagamentos");
  return { success: true };
}
