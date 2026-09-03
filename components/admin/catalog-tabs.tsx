"use client";

import { Boxes, MapPin } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StockTab } from "@/components/admin/stock-tab";
import { LocationsTab } from "@/components/admin/locations-tab";

type Product = {
  id: string;
  name: string;
  category: string | null;
  image_url: string | null;
  is_active: boolean | null;
};
type InventoryRow = { location_id: string; product_id: string; price: number; quantity: number };
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
  return (
    <Tabs defaultValue="estoque">
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

      <TabsContent value="estoque" className="pt-4">
        <StockTab locations={locations} products={products} inventory={inventory} />
      </TabsContent>

      <TabsContent value="locais" className="pt-4">
        <LocationsTab locations={locations} stockByLocation={stockByLocation} />
      </TabsContent>
    </Tabs>
  );
}
