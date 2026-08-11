"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/session";
import { sendPaymentDeclaredEmail } from "@/lib/email";

const declareSchema = z.object({
  amount: z.coerce.number().positive("Informe um valor válido"),
  isPartial: z.coerce.boolean(),
});

export type ActionResult = { error?: string; success?: boolean };

export async function declarePayment(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const { email, profile } = await requireUser();

  const parsed = declareSchema.safeParse({
    amount: formData.get("amount"),
    isPartial: formData.get("isPartial") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("declare_payment", {
    p_user_declared_amount: parsed.data.amount,
    p_is_partial: parsed.data.isPartial,
  });

  if (error) {
    return { error: error.message };
  }

  if (email) {
    await sendPaymentDeclaredEmail(email, profile.full_name, parsed.data.amount);
  }

  revalidatePath("/pagamento");
  revalidatePath("/extrato");
  return { success: true };
}

export async function markDivergenceSeen(paymentId: string) {
  await requireUser();
  const supabase = await createClient();
  await supabase.rpc("mark_divergence_seen", { p_payment_id: paymentId });
  revalidatePath("/pagamento");
}
