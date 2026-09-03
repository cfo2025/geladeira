"use client";

import { useState } from "react";
import { Boxes, MapPin } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StockTab } from "@/components/admin/stock-tab";
import { LocationsTab } from "@/components/admin/locations-tab";
import { CreateProductDialog } from "@/components/admin/create-product-dialog";
import { CreateLocationDialog } from "@/components/admin/create-location-dialog";

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
type LocationRow = { id: string; name: string; description: string | null };

export function CatalogTabs({
  locations,
  products,
  inventory,
  stockByLocation,
}: {
  locations: LocationRow[];
  products: Product[];
  inventory: InventoryRow[];
  stockByLocation: Record<string, number>;
}) {
  const [tab, setTab] = useState("estoque");

  return (
    <Tabs value={tab} onValueChange={(value) => setTab(value as string)}>
      <div className="flex items-center justify-between gap-3">
        <TabsList>
          <TabsTrigger value="estoque">
            <Boxes className="h-4 w-4" />
            Estoque
          </TabsTrigger>
          <TabsTrigger value="locais">
            <MapPin className="h-4 w-4" />
            Locais
          </TabsTrigger>
        </TabsList>
        {tab === "estoque" ? <CreateProductDialog /> : <CreateLocationDialog iconOnly />}
      </div>

      <TabsContent value="estoque" className="pt-4">
        <StockTab locations={locations} products={products} inventory={inventory} />
      </TabsContent>

      <TabsContent value="locais" className="pt-4">
        <LocationsTab locations={locations} stockByLocation={stockByLocation} />
      </TabsContent>
    </Tabs>
  );
}
