"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireExpenseOrderer, requireAdmin } from "@/lib/session";

export type ActionResult = { error?: string; success?: boolean };

const expenseSchema = z.object({
  valor: z.coerce.number().positive("Informe um valor válido"),
  localDestinado: z.string().min(2, "Informe o local/finalidade da despesa").max(200),
  responsavelRetirada: z.string().min(2, "Informe o responsável pela retirada").max(120),
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
    observacoes: formData.get("observacoes") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_expense_outflow", {
    p_valor: parsed.data.valor,
    p_local_destinado: parsed.data.localDestinado,
    p_responsavel_retirada: parsed.data.responsavelRetirada,
    p_observacoes: parsed.data.observacoes ?? null,
  });
  if (error) return { error: error.message };

  revalidatePath("/transparencia");
  revalidatePath("/dashboard");
  return { success: true };
}

const purchaseSchema = z.object({
  productId: z.string().uuid("Selecione um produto"),
  quantity: z.coerce.number().int().min(1, "Informe uma quantidade maior que zero"),
  unitCost: z.coerce.number().positive("Informe o valor pago por unidade"),
  observacoes: z.string().max(500).optional(),
});

/** Registra uma compra de produto (só custo/margem — não repõe estoque nem
 *  desconta do saldo em caixa; isso continua sendo feito à parte em "Repor
 *  estoque" e "Lançar despesa", respectivamente). Recalcula o custo médio
 *  ponderado do produto, usado no lucro previsto/real. Só admin. */
export async function registerProductPurchase(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin();

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
  return { success: true };
}
