import Image from "next/image";
import { Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WithdrawForm } from "@/components/withdraw-form";
import { formatCurrency } from "@/lib/format";

export function ProductCard({
  productId,
  locationId,
  name,
  category,
  imageUrl,
  price,
  quantity,
}: {
  productId: string;
  locationId: string;
  name: string;
  category: string | null;
  imageUrl: string | null;
  price: number;
  quantity: number;
}) {
  return (
    <Card className="overflow-hidden pt-0">
      <div className="relative flex aspect-square items-center justify-center bg-muted/50">
        {imageUrl ? (
          <Image src={imageUrl} alt={name} fill className="object-cover" unoptimized />
        ) : (
          <Package className="h-10 w-10 text-muted-foreground/40" />
        )}
      </div>
      <CardContent className="space-y-2.5 pt-4">
        <div>
          <p className="truncate text-sm font-semibold">{name}</p>
          <p className="truncate text-xs text-muted-foreground">{category || " "}</p>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-base font-bold">{formatCurrency(price)}</span>
          {quantity > 0 ? (
            <Badge className="border-transparent bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400">
              {quantity} unidades
            </Badge>
          ) : (
            <Badge variant="destructive">Sem Estoque</Badge>
          )}
        </div>
        <WithdrawForm
          productId={productId}
          locationId={locationId}
          maxQuantity={quantity}
          className="w-full"
        />
      </CardContent>
    </Card>
  );
}
