"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/session";

const withdrawSchema = z.object({
  productId: z.string().uuid(),
  locationId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(99),
});

export type ActionResult = { error?: string; success?: boolean };

export async function createWithdrawal(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireUser();

  const parsed = withdrawSchema.safeParse({
    productId: formData.get("productId"),
    locationId: formData.get("locationId"),
    quantity: formData.get("quantity") ?? 1,
  });

  if (!parsed.success) {
    return { error: "Dados inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_withdrawal", {
    p_product_id: parsed.data.productId,
    p_location_id: parsed.data.locationId,
    p_quantity: parsed.data.quantity,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/loja");
  revalidatePath("/dashboard");
  revalidatePath("/extrato");
  return { success: true };
}

const cancellationSchema = z.object({
  withdrawalId: z.string().uuid(),
  reason: z.string().min(3, "Descreva o motivo do cancelamento").max(500),
});

export async function requestCancellation(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireUser();

  const parsed = cancellationSchema.safeParse({
    withdrawalId: formData.get("withdrawalId"),
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("request_withdrawal_cancellation", {
    p_withdrawal_id: parsed.data.withdrawalId,
    p_reason: parsed.data.reason,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/extrato");
  return { success: true };
}
