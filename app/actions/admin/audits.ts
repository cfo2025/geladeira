"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/session";

export type ActionResult = { error?: string; success?: boolean };

const itemSchema = z.object({
  product_id: z.string().uuid(),
  physical_quantity: z.coerce.number().int().min(0),
});

const auditSchema = z.object({
  locationId: z.string().uuid(),
  notes: z.string().max(1000).optional(),
  items: z.array(itemSchema).min(1),
});

export async function createStockAudit(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const locationId = formData.get("locationId") as string;
  const notes = (formData.get("notes") as string) || undefined;
  const itemsRaw = formData.get("items") as string;

  let items: unknown;
  try {
    items = JSON.parse(itemsRaw);
  } catch {
    return { error: "Itens inválidos" };
  }

  const parsed = auditSchema.safeParse({ locationId, notes, items });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { data: auditId, error } = await supabase.rpc("create_stock_audit", {
    p_location_id: parsed.data.locationId,
    p_notes: parsed.data.notes ?? null,
    p_items: parsed.data.items,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/auditoria");
  redirect(`/admin/auditoria/${auditId}`);
}

export async function applyStockAudit(auditId: string): Promise<ActionResult> {
  await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase.rpc("apply_stock_audit", { p_audit_id: auditId });
  if (error) return { error: error.message };

  revalidatePath(`/admin/auditoria/${auditId}`);
  revalidatePath("/admin/estoque");
  revalidatePath("/loja");
  revalidatePath("/dashboard");
  return { success: true };
}
