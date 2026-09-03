import Image from "next/image";
import { Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
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
  promoPrice,
  quantity,
  compact = false,
}: {
  productId: string;
  locationId: string;
  locationName: string;
  name: string;
  category: string | null;
  imageUrl: string | null;
  price: number;
  promoPrice?: number | null;
  quantity: number;
  compact?: boolean;
}) {
  const hasPromo = promoPrice != null && promoPrice < price;
  const effectivePrice = hasPromo ? promoPrice : price;

  return (
    <Card className="w-full overflow-hidden pt-0" size={compact ? "sm" : "default"}>
      <div
        className={cn(
          "relative flex w-full items-center justify-center overflow-hidden rounded-t-lg bg-muted/50",
          compact ? "h-20" : "h-36 sm:h-40"
        )}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-contain p-2"
            unoptimized
          />
        ) : (
          <Package className={cn("text-muted-foreground/40", compact ? "h-6 w-6" : "h-10 w-10")} />
        )}
      </div>
      <CardContent className={cn(compact ? "space-y-1.5 pt-2" : "space-y-2 pt-4")}>
        <div>
          <p className={cn("line-clamp-1 font-semibold", compact ? "text-xs" : "text-sm")}>{name}</p>
          {!compact && <p className="line-clamp-1 text-xs text-muted-foreground">{category || " "}</p>}
        </div>
        <div className={cn("flex items-center justify-between gap-2", compact ? "my-1" : "my-2")}>
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5">
            {hasPromo && (
              <span className={cn("text-muted-foreground line-through", compact ? "text-[10px]" : "text-xs")}>
                {formatCurrency(price)}
              </span>
            )}
            <span
              className={cn(
                "font-bold",
                compact ? "text-sm" : "text-base",
                hasPromo && "text-green-600 dark:text-green-400"
              )}
            >
              {formatCurrency(effectivePrice)}
            </span>
          </div>
          {quantity > 0 ? (
            <Badge
              className={cn(
                "border-transparent bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
                compact && "px-1.5 py-0 text-[10px]"
              )}
            >
              {quantity} un.
            </Badge>
          ) : (
            <Badge variant="destructive" className={compact ? "px-1.5 py-0 text-[10px]" : undefined}>
              Sem estoque
            </Badge>
          )}
        </div>
        <CartQuantityControl
          productId={productId}
          locationId={locationId}
          locationName={locationName}
          productName={name}
          category={category}
          price={effectivePrice}
          maxQuantity={quantity}
          compact={compact}
        />
      </CardContent>
    </Card>
  );
}
