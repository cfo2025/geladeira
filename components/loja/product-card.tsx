import Image from "next/image";
import { Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CartQuantityControl } from "@/components/loja/cart-quantity-control";
import { formatCurrency } from "@/lib/format";

export function ProductCard({
  productId,
  locationId,
  locationName,
  name,
  category,
  imageUrl,
  price,
  quantity,
}: {
  productId: string;
  locationId: string;
  locationName: string;
  name: string;
  category: string | null;
  imageUrl: string | null;
  price: number;
  quantity: number;
}) {
  return (
    <Card className="w-full overflow-hidden pt-0">
      <div className="relative flex h-36 w-full items-center justify-center overflow-hidden rounded-t-lg bg-muted/50 sm:h-40">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-contain p-2"
            unoptimized
          />
        ) : (
          <Package className="h-10 w-10 text-muted-foreground/40" />
        )}
      </div>
      <CardContent className="space-y-2 pt-4">
        <div>
          <p className="line-clamp-1 text-sm font-semibold">{name}</p>
          <p className="line-clamp-1 text-xs text-muted-foreground">{category || " "}</p>
        </div>
        <div className="my-2 flex items-center justify-between gap-2">
          <span className="text-base font-bold">{formatCurrency(price)}</span>
          {quantity > 0 ? (
            <Badge className="border-transparent bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400">
              {quantity} unidades
            </Badge>
          ) : (
            <Badge variant="destructive">Sem Estoque</Badge>
          )}
        </div>
        <CartQuantityControl
          productId={productId}
          locationId={locationId}
          locationName={locationName}
          productName={name}
          category={category}
          price={price}
          maxQuantity={quantity}
        />
      </CardContent>
    </Card>
  );
}
