"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Package } from "lucide-react";
import { LocationCard } from "@/components/loja/location-card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProductPriceForm } from "@/components/admin/product-price-form";
import { RestockDialog } from "@/components/admin/restock-dialog";
import { TransferDialog } from "@/components/admin/transfer-dialog";
import { PromoDialog } from "@/components/admin/promo-dialog";
import { EditProductDialog } from "@/components/admin/edit-product-dialog";
import { ProductActiveSwitch } from "@/components/admin/product-active-switch";
import { ConfirmDeleteDialog } from "@/components/admin/confirm-delete-dialog";
import { deleteProduct } from "@/app/actions/admin/catalog";
import { formatCurrency } from "@/lib/format";

type Product = {
  id: string;
  name: string;
  category: string | null;
  image_url: string | null;
  is_active: boolean | null;
  price: number;
  promo_price: number | null;
};
type InventoryRow = {
  location_id: string;
  product_id: string;
  quantity: number;
};
type LocationRow = { id: string; name: string };

export function StockTab({
  locations,
  products,
  inventory,
}: {
  locations: LocationRow[];
  products: Product[];
  inventory: InventoryRow[];
}) {
  const [locationId, setLocationId] = useState(locations[0]?.id ?? "");

  const totalStockByProduct = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of inventory) {
      map.set(item.product_id, (map.get(item.product_id) ?? 0) + item.quantity);
    }
    return map;
  }, [inventory]);

  const totalsByLocation = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of inventory) {
      map.set(item.location_id, (map.get(item.location_id) ?? 0) + item.quantity);
    }
    return map;
  }, [inventory]);

  const locationTotals = useMemo(() => Object.fromEntries(totalsByLocation), [totalsByLocation]);

  const inventoryByKey = useMemo(() => {
    const map = new Map<string, InventoryRow>();
    for (const item of inventory) {
      map.set(`${item.location_id}:${item.product_id}`, item);
    }
    return map;
  }, [inventory]);

  const selectedLocation = locations.find((l) => l.id === locationId);

  if (locations.length === 0) {
    return (
      <p className="text-muted-foreground">Nenhum local cadastrado. Crie um local na aba Locais.</p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {locations.map((loc) => (
          <LocationCard
            key={loc.id}
            name={loc.name}
            totalItems={totalsByLocation.get(loc.id) ?? 0}
            active={loc.id === locationId}
            onSelect={() => setLocationId(loc.id)}
          />
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Estoque</TableHead>
              <TableHead className="text-right">Ações</TableHead>
              <TableHead className="text-right">Produto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => {
              const inv = inventoryByKey.get(`${locationId}:${product.id}`);
              const quantity = inv?.quantity ?? 0;
              const totalStock = totalStockByProduct.get(product.id) ?? 0;
              return (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted/50">
                        {product.image_url ? (
                          <Image
                            src={product.image_url}
                            alt={product.name}
                            fill
                            className="object-contain p-1"
                            unoptimized
                          />
                        ) : (
                          <Package className="h-4 w-4 text-muted-foreground/40" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {product.name}
                          {!product.is_active && (
                            <Badge variant="secondary" className="ml-1.5 align-middle">
                              inativo
                            </Badge>
                          )}
                        </p>
                        {product.category && (
                          <p className="truncate text-xs text-muted-foreground">{product.category}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <ProductPriceForm productId={product.id} price={product.price} />
                      {product.promo_price != null && (
                        <p className="text-xs font-medium text-green-600 dark:text-green-400">
                          Promoção: {formatCurrency(product.promo_price)} (
                          {Math.round((1 - product.promo_price / product.price) * 100)}% off)
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={quantity > 0 ? "default" : "secondary"}
                      className={
                        quantity > 0
                          ? "border-transparent bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400"
                          : undefined
                      }
                    >
                      {quantity} un.
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1.5">
                      <RestockDialog
                        locationId={locationId}
                        locationName={selectedLocation?.name ?? ""}
                        productId={product.id}
                        productName={product.name}
                        currentQuantity={quantity}
                        disabled={product.price <= 0}
                      />
                      <TransferDialog
                        locations={locations}
                        locationTotals={locationTotals}
                        fromLocationId={locationId}
                        fromLocationName={selectedLocation?.name ?? ""}
                        productId={product.id}
                        productName={product.name}
                        currentQuantity={quantity}
                        disabled={quantity <= 0 || locations.length < 2}
                      />
                      <PromoDialog
                        productId={product.id}
                        productName={product.name}
                        price={product.price}
                        promoPrice={product.promo_price}
                        disabled={product.price <= 0}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1.5">
                      <EditProductDialog
                        id={product.id}
                        name={product.name}
                        category={product.category}
                        imageUrl={product.image_url}
                      />
                      <ProductActiveSwitch id={product.id} isActive={product.is_active ?? true} />
                      <ConfirmDeleteDialog
                        title="Excluir produto"
                        description={`Isso remove "${product.name}" do catálogo (todas as geladeiras). Esta ação não pode ser desfeita.`}
                        action={() => deleteProduct(product.id)}
                        disabled={totalStock > 0}
                        disabledReason="Zere o estoque em todas as geladeiras para excluir este produto"
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {products.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Nenhum produto cadastrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
