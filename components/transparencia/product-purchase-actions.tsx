"use client";

import { deleteProductPurchase } from "@/app/actions/transparencia";
import { ConfirmDeleteDialog } from "@/components/admin/confirm-delete-dialog";
import { ProductPurchaseEditDialog } from "@/components/transparencia/product-purchase-edit-dialog";
import { formatCurrency } from "@/lib/format";

type PurchaseRow = {
  id: string;
  quantity: number;
  unit_cost: number;
  observacoes: string | null;
  product: { name: string } | null;
};

/** Editar/excluir uma compra de produto — admin/ordenador de despesa. Ajusta
 *  o estoque e o custo médio automaticamente; fica registrado em Logs. */
export function ProductPurchaseActions({ purchase }: { purchase: PurchaseRow }) {
  return (
    <div className="flex justify-end gap-1">
      <ProductPurchaseEditDialog purchase={purchase} />
      <ConfirmDeleteDialog
        title="Excluir compra de produto"
        description={`Isso remove permanentemente a compra de ${purchase.quantity}x "${purchase.product?.name ?? "produto"}" (${formatCurrency(purchase.unit_cost * purchase.quantity)}), tira do estoque e recalcula o custo médio.`}
        action={() => deleteProductPurchase(purchase.id)}
        logged
      />
    </div>
  );
}
