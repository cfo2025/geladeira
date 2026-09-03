"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/session";
import { logAdminAction } from "@/lib/audit";

export type ActionResult = { error?: string; success?: boolean };

/** Erro de chave estrangeira do Postgres — algo ainda referencia a linha. */
const FOREIGN_KEY_VIOLATION = "23503";

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

  revalidatePath("/admin/estoque");
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

  revalidatePath("/admin/estoque");
  revalidatePath("/loja");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteLocation(id: string): Promise<ActionResult> {
  const { userId: actorId } = await requireAdmin();
  const supabase = await createClient();

  const { data: stock } = await supabase
    .from("inventory")
    .select("quantity")
    .eq("location_id", id)
    .gt("quantity", 0)
    .limit(1);

  if (stock && stock.length > 0) {
    return { error: "Este local ainda tem produtos em estoque. Zere o estoque antes de excluir." };
  }

  const { error } = await supabase.from("locations").delete().eq("id", id);
  if (error) {
    if (error.code === FOREIGN_KEY_VIOLATION) {
      return {
        error: "Não é possível excluir: existem retiradas registradas neste local. Considere renomeá-lo.",
      };
    }
    return { error: error.message };
  }

  await logAdminAction(actorId, null, "location_deleted", { location_id: id });

  revalidatePath("/admin/estoque");
  revalidatePath("/loja");
  revalidatePath("/dashboard");
  return { success: true };
}

// ---- Produtos ----

const productSchema = z.object({
  name: z.string().min(2, "Nome muito curto").max(120),
  category: z.string().max(60).optional(),
  image_url: z.union([z.string().url("URL de imagem inválida"), z.literal("")]).optional(),
});

function normalizeProductInput(data: z.infer<typeof productSchema>) {
  return {
    name: data.name,
    category: data.category || null,
    image_url: data.image_url || null,
  };
}

export async function createProduct(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category") || undefined,
    image_url: formData.get("image_url") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase.from("products").insert(normalizeProductInput(parsed.data));
  if (error) return { error: error.message };

  revalidatePath("/admin/estoque");
  revalidatePath("/loja");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateProduct(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin();

  const id = formData.get("id") as string;
  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category") || undefined,
    image_url: formData.get("image_url") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update(normalizeProductInput(parsed.data))
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/estoque");
  revalidatePath("/loja");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function toggleProductActive(id: string, isActive: boolean) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("products").update({ is_active: isActive }).eq("id", id);
  revalidatePath("/admin/estoque");
  revalidatePath("/loja");
  revalidatePath("/dashboard");
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const { userId: actorId } = await requireAdmin();
  const supabase = await createClient();

  const { data: stock } = await supabase
    .from("inventory")
    .select("quantity")
    .eq("product_id", id)
    .gt("quantity", 0)
    .limit(1);

  if (stock && stock.length > 0) {
    return { error: "Este produto ainda tem estoque disponível. Zere o estoque antes de excluir." };
  }

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    if (error.code === FOREIGN_KEY_VIOLATION) {
      return {
        error: "Não é possível excluir: existem retiradas registradas deste produto. Desative-o em vez de excluir.",
      };
    }
    return { error: error.message };
  }

  await logAdminAction(actorId, null, "product_deleted", { product_id: id });

  revalidatePath("/admin/estoque");
  revalidatePath("/loja");
  revalidatePath("/dashboard");
  return { success: true };
}

// ---- Estoque (preço por local, movimentações de quantidade) ----

const priceSchema = z.object({
  locationId: z.string().uuid(),
  productId: z.string().uuid(),
  price: z.coerce.number().min(0, "Preço inválido"),
});

export async function updateInventoryPrice(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = priceSchema.safeParse({
    locationId: formData.get("locationId"),
    productId: formData.get("productId"),
    price: formData.get("price"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase.from("inventory").upsert(
    {
      location_id: parsed.data.locationId,
      product_id: parsed.data.productId,
      price: parsed.data.price,
    },
    { onConflict: "location_id,product_id", ignoreDuplicates: false }
  );
  if (error) return { error: error.message };

  revalidatePath("/admin/estoque");
  revalidatePath("/loja");
  revalidatePath("/dashboard");
  return { success: true };
}

const restockSchema = z.object({
  locationId: z.string().uuid(),
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1, "Informe uma quantidade maior que zero"),
  notes: z.string().max(500).optional(),
});

export async function restockInventory(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = restockSchema.safeParse({
    locationId: formData.get("locationId"),
    productId: formData.get("productId"),
    quantity: formData.get("quantity"),
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase.rpc("restock_inventory", {
    p_location_id: parsed.data.locationId,
    p_product_id: parsed.data.productId,
    p_quantity: parsed.data.quantity,
    p_notes: parsed.data.notes ?? null,
  });
  if (error) return { error: error.message };

  revalidatePath("/admin/estoque");
  revalidatePath("/loja");
  revalidatePath("/dashboard");
  return { success: true };
}

const transferSchema = z.object({
  fromLocationId: z.string().uuid(),
  toLocationId: z.string().uuid(),
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1, "Informe uma quantidade maior que zero"),
});

export async function transferInventory(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = transferSchema.safeParse({
    fromLocationId: formData.get("fromLocationId"),
    toLocationId: formData.get("toLocationId"),
    productId: formData.get("productId"),
    quantity: formData.get("quantity"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  if (parsed.data.fromLocationId === parsed.data.toLocationId) {
    return { error: "Escolha um local de destino diferente do local de origem" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("transfer_inventory", {
    p_from_location_id: parsed.data.fromLocationId,
    p_to_location_id: parsed.data.toLocationId,
    p_product_id: parsed.data.productId,
    p_quantity: parsed.data.quantity,
  });
  if (error) return { error: error.message };

  revalidatePath("/admin/estoque");
  revalidatePath("/loja");
  revalidatePath("/dashboard");
  return { success: true };
}
