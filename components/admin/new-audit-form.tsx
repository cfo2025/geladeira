"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createStockAudit, type ActionResult } from "@/app/actions/admin/audits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type InventoryItem = { productId: string; productName: string; expectedQuantity: number };

export function NewAuditForm({
  locationId,
  items,
}: {
  locationId: string;
  items: InventoryItem[];
}) {
  const [counts, setCounts] = useState<Record<string, string>>(
    Object.fromEntries(items.map((i) => [i.productId, String(i.expectedQuantity)]))
  );
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    const payloadItems = items.map((i) => ({
      product_id: i.productId,
      physical_quantity: Number(counts[i.productId] ?? 0),
    }));
    formData.set("locationId", locationId);
    formData.set("items", JSON.stringify(payloadItems));

    startTransition(async () => {
      const result: ActionResult | void = await createStockAudit(formData);
      if (result?.error) toast.error(result.error);
    });
  }

  if (items.length === 0) {
    return <p className="text-muted-foreground">Nenhum produto com estoque cadastrado neste local.</p>;
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Esperado</TableHead>
                <TableHead className="text-right">Contagem física</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.productId}>
                  <TableCell className="font-medium">{item.productName}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {item.expectedQuantity}
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      min={0}
                      className="ml-auto w-24"
                      value={counts[item.productId] ?? ""}
                      onChange={(e) =>
                        setCounts((prev) => ({ ...prev, [item.productId]: e.target.value }))
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Label htmlFor="notes">Observações (opcional)</Label>
        <Textarea id="notes" name="notes" maxLength={1000} />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Registrar balanço"}
      </Button>
    </form>
  );
}
