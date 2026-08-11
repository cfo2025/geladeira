"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/session";

export type ActionResult = { error?: string; success?: boolean };

// ---- Locais ----

const locationSchema = z.object({
  name: z.string().min(2, "Nome muito curto").max(120),
  description: z.string().max(500).optional(),
});

export async function createLocation(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = locationSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase.from("locations").insert(parsed.data);
  if (error) return { error: error.code === "23505" ? "Já existe um local com este nome" : error.message };

  revalidatePath("/admin/locais");
  revalidatePath("/loja");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateLocation(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin();

  const id = formData.get("id") as string;
  const parsed = locationSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase.from("locations").update(parsed.data).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/locais");
  revalidatePath("/loja");
  revalidatePath("/dashboard");
  return { success: true };
}

// ---- Produtos ----

const productSchema = z.object({
  name: z.string().min(2, "Nome muito curto").max(120),
});

export async function createProduct(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = productSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase.from("products").insert(parsed.data);
  if (error) return { error: error.message };

  revalidatePath("/admin/produtos");
  revalidatePath("/admin/estoque");
  return { success: true };
}

export async function renameProduct(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin();

  const id = formData.get("id") as string;
  const parsed = productSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase.from("products").update(parsed.data).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/produtos");
  revalidatePath("/admin/estoque");
  revalidatePath("/loja");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function toggleProductActive(id: string, isActive: boolean) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("products").update({ is_active: isActive }).eq("id", id);
  revalidatePath("/admin/produtos");
  revalidatePath("/loja");
  revalidatePath("/dashboard");
}

// ---- Estoque (preço/quantidade por local) ----

const inventorySchema = z.object({
  locationId: z.string().uuid(),
  productId: z.string().uuid(),
  price: z.coerce.number().min(0, "Preço inválido"),
  quantity: z.coerce.number().int().min(0, "Quantidade inválida"),
});

export async function upsertInventory(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = inventorySchema.safeParse({
    locationId: formData.get("locationId"),
    productId: formData.get("productId"),
    price: formData.get("price"),
    quantity: formData.get("quantity"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase.from("inventory").upsert(
    {
      location_id: parsed.data.locationId,
      product_id: parsed.data.productId,
      price: parsed.data.price,
      quantity: parsed.data.quantity,
    },
    { onConflict: "location_id,product_id" }
  );
  if (error) return { error: error.message };

  revalidatePath("/admin/estoque");
  revalidatePath("/loja");
  revalidatePath("/dashboard");
  return { success: true };
}
