"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Package, TriangleAlert, Search, ChevronLeft, ChevronRight, CircleCheck, CircleOff } from "lucide-react";
import { LocationCard } from "@/components/loja/location-card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductPriceForm } from "@/components/admin/product-price-form";
import { ProductCostForm } from "@/components/admin/product-cost-form";
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
  cost_price: number;
};
type InventoryRow = {
  location_id: string;
  product_id: string;
  quantity: number;
};
type LocationRow = { id: string; name: string };

const PAGE_SIZE = 10;

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
  const [statusTab, setStatusTab] = useState<"ativos" | "inativos">("ativos");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);

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

  const activeProducts = useMemo(() => products.filter((p) => p.is_active), [products]);
  const inactiveProducts = useMemo(() => products.filter((p) => !p.is_active), [products]);
  const baseList = statusTab === "ativos" ? activeProducts : inactiveProducts;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return baseList;
    return baseList.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.category ?? "").toLowerCase().includes(q)
    );
  }, [baseList, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const pageProducts = filtered.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);

  function handleStatusTabChange(next: string) {
    setStatusTab(next as "ativos" | "inativos");
    setQuery("");
    setPage(0);
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    setPage(0);
  }

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

      <Tabs value={statusTab} onValueChange={handleStatusTabChange}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="ativos">
              <CircleCheck className="h-4 w-4" />
              Ativos
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                {activeProducts.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="inativos">
              <CircleOff className="h-4 w-4" />
              Inativos
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                {inactiveProducts.length}
              </span>
            </TabsTrigger>
          </TabsList>

          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Buscar por nome ou tipo..."
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              className="h-9 w-full rounded-full border border-input bg-muted/40 pr-3 pl-9 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
        </div>

        <TabsContent value={statusTab} className="mt-4 space-y-3">
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Custo</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                  <TableHead className="text-right">Produto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageProducts.map((product) => {
                  const inv = inventoryByKey.get(`${locationId}:${product.id}`);
                  const quantity = inv?.quantity ?? 0;
                  const totalStock = totalStockByProduct.get(product.id) ?? 0;
                  const effectivePrice = product.promo_price ?? product.price;
                  const sellingBelowCost = product.cost_price > 0 && effectivePrice < product.cost_price;
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
                          {sellingBelowCost && (
                            <p
                              className="flex items-center gap-1 text-xs font-medium text-destructive"
                              title={`Custo médio: ${formatCurrency(product.cost_price)}`}
                            >
                              <TriangleAlert className="h-3 w-3 shrink-0" />
                              Vendendo abaixo do custo
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <ProductCostForm productId={product.id} costPrice={product.cost_price} />
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
                            description={`Isso remove "${product.name}" do catálogo (todas as geladeiras).`}
                            action={() => deleteProduct(product.id)}
                            disabled={totalStock > 0}
                            disabledReason="Zere o estoque em todas as geladeiras para excluir este produto"
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {pageProducts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      {query
                        ? "Nenhum produto encontrado."
                        : statusTab === "ativos"
                          ? "Nenhum produto ativo cadastrado."
                          : "Nenhum produto inativo."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {filtered.length > 0 && (
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                {filtered.length} {filtered.length === 1 ? "produto" : "produtos"}
                {query && ` de ${baseList.length}`}
              </p>
              {totalPages > 1 && (
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    disabled={currentPage === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    aria-label="Página anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Página {currentPage + 1} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    disabled={currentPage >= totalPages - 1}
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    aria-label="Próxima página"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
