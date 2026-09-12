"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireExpenseOrderer } from "@/lib/session";

export type ActionResult = { error?: string; success?: boolean };

const expenseSchema = z.object({
  valor: z.coerce.number().positive("Informe um valor válido"),
  localDestinado: z.string().min(2, "Informe o local/finalidade da despesa").max(200),
  responsavelRetirada: z.string().min(2, "Informe o responsável pela retirada").max(120),
  tag: z.enum(["empenho", "bonus", "descaminho"], { message: "Selecione o tipo de saída" }),
  observacoes: z.string().max(500).optional(),
});

/** Lança uma saída de caixa. Só admin/ordenador de despesa (checado de novo
 *  dentro da função SECURITY DEFINER create_expense_outflow, que também
 *  valida o valor contra o saldo disponível na hora — RBAC não passa por
 *  aqui sozinho: chamar o RPC direto via requisição também é bloqueado). */
export async function createExpenseOutflow(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireExpenseOrderer();

  const parsed = expenseSchema.safeParse({
    valor: formData.get("valor"),
    localDestinado: formData.get("localDestinado"),
    responsavelRetirada: formData.get("responsavelRetirada"),
    tag: formData.get("tag"),
    observacoes: formData.get("observacoes") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_expense_outflow", {
    p_valor: parsed.data.valor,
    p_local_destinado: parsed.data.localDestinado,
    p_responsavel_retirada: parsed.data.responsavelRetirada,
    p_tag: parsed.data.tag,
    p_observacoes: parsed.data.observacoes ?? null,
  });
  if (error) return { error: error.message };

  revalidatePath("/transparencia");
  revalidatePath("/dashboard");
  return { success: true };
}

const updateExpenseSchema = z.object({
  id: z.string().uuid(),
  valor: z.coerce.number().positive("Informe um valor válido"),
  localDestinado: z.string().min(2, "Informe o local/finalidade da despesa").max(200),
  responsavelRetirada: z.string().min(2, "Informe o responsável pela retirada").max(120),
  tag: z.enum(["empenho", "bonus", "descaminho"], { message: "Selecione o tipo de saída" }),
  observacoes: z.string().max(500).optional(),
});

/** Edita uma saída de caixa já lançada. Fica registrado em audit_logs (com
 *  o antes/depois) porque mexe no saldo/balanço da loja. */
export async function updateExpenseOutflow(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireExpenseOrderer();

  const parsed = updateExpenseSchema.safeParse({
    id: formData.get("id"),
    valor: formData.get("valor"),
    localDestinado: formData.get("localDestinado"),
    responsavelRetirada: formData.get("responsavelRetirada"),
    tag: formData.get("tag"),
    observacoes: formData.get("observacoes") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_expense_outflow", {
    p_id: parsed.data.id,
    p_valor: parsed.data.valor,
    p_local_destinado: parsed.data.localDestinado,
    p_responsavel_retirada: parsed.data.responsavelRetirada,
    p_tag: parsed.data.tag,
    p_observacoes: parsed.data.observacoes ?? null,
  });
  if (error) return { error: error.message };

  revalidatePath("/transparencia");
  revalidatePath("/dashboard");
  revalidatePath("/admin/logs");
  return { success: true };
}

/** Exclui uma saída de caixa. Fica registrado em audit_logs com o
 *  snapshot completo, já que a linha some da tabela. */
export async function deleteExpenseOutflow(id: string): Promise<ActionResult> {
  await requireExpenseOrderer();

  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_expense_outflow", { p_id: id });
  if (error) return { error: error.message };

  revalidatePath("/transparencia");
  revalidatePath("/dashboard");
  revalidatePath("/admin/logs");
  return { success: true };
}

const purchaseSchema = z.object({
  productId: z.string().uuid("Selecione um produto"),
  quantity: z.coerce.number().int().min(1, "Informe uma quantidade maior que zero"),
  unitCost: z.coerce.number().positive("Informe o valor pago por unidade"),
  observacoes: z.string().max(500).optional(),
});

/** Registra uma compra de produto: soma no estoque (repõe automaticamente
 *  no único local ativo) e recalcula o custo médio ponderado do produto,
 *  usado no lucro previsto/real. Não desconta do saldo em caixa — se o
 *  dinheiro realmente saiu do caixa pra pagar, lança também em "Lançar
 *  despesa". Admin ou ordenador de despesa. */
export async function registerProductPurchase(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireExpenseOrderer();

  const parsed = purchaseSchema.safeParse({
    productId: formData.get("productId"),
    quantity: formData.get("quantity"),
    unitCost: formData.get("unitCost"),
    observacoes: formData.get("observacoes") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase.rpc("register_product_purchase", {
    p_product_id: parsed.data.productId,
    p_quantity: parsed.data.quantity,
    p_unit_cost: parsed.data.unitCost,
    p_observacoes: parsed.data.observacoes ?? null,
  });
  if (error) return { error: error.message };

  revalidatePath("/transparencia");
  revalidatePath("/admin/estoque");
  revalidatePath("/loja");
  revalidatePath("/dashboard");
  return { success: true };
}
