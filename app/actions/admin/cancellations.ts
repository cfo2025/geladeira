"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/session";
import { sendCancellationDecisionEmail } from "@/lib/email";

export type ActionResult = { error?: string; success?: boolean };

export async function reviewCancellationRequest(
  requestId: string,
  approve: boolean
): Promise<ActionResult> {
  await requireAdmin();

  const supabase = await createClient();
  const { data: request } = await supabase
    .from("withdrawal_cancellation_requests")
    .select("user_id, withdrawal:withdrawals(product:products(name))")
    .eq("id", requestId)
    .single();

  const { error } = await supabase.rpc("review_cancellation_request", {
    p_request_id: requestId,
    p_approve: approve,
  });

  if (error) return { error: error.message };

  if (request?.user_id) {
    const admin = createAdminClient();
    const [{ data: userData }, { data: profile }] = await Promise.all([
      admin.auth.admin.getUserById(request.user_id),
      admin.from("profiles").select("full_name").eq("id", request.user_id).single(),
    ]);
    if (userData.user?.email) {
      await sendCancellationDecisionEmail(
        userData.user.email,
        profile?.full_name ?? "",
        approve,
        request.withdrawal?.product?.name ?? ""
      );
    }
  }

  revalidatePath("/admin/retiradas");
  return { success: true };
}
