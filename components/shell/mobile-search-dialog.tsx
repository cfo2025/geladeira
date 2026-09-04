"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { useProductSearch } from "@/hooks/use-product-search";
import { SearchResultsList } from "@/components/shell/search-results-list";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type InventoryItem = {
  location_id: string;
  quantity: number;
  product: { name: string; category: string | null };
};

export function MobileSearchDialog({
  locations,
  inventory,
}: {
  locations: { id: string; name: string }[];
  inventory: InventoryItem[];
}) {
  const { query, setQuery, results } = useProductSearch(locations, inventory);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      // Base UI monta o conteúdo do diálogo de forma assíncrona; um pequeno
      // atraso garante que o input já esteja no DOM ao focar.
      const timeout = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timeout);
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden"
            title="Buscar item"
            aria-label="Buscar item"
          />
        }
      >
        <Search className="h-4.5 w-4.5" />
      </DialogTrigger>
      <DialogContent className="flex max-h-[80vh] flex-col gap-3">
        <DialogHeader className="sr-only">
          <DialogTitle>Buscar item</DialogTitle>
          <DialogDescription>Busque um produto pelo nome ou categoria.</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={inputRef}
            type="search"
            placeholder="Buscar item..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 w-full rounded-full border border-input bg-muted/40 pr-3 pl-9 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {query.trim().length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              Digite o nome de um item para ver onde e quanto tem disponível.
            </p>
          ) : (
            <SearchResultsList results={results} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
