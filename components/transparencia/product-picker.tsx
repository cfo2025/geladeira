"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Search, Package, X } from "lucide-react";

type Product = { id: string; name: string; category: string | null; image_url: string | null };

/**
 * Campo de busca de produto com foto — digita o nome, aparece uma lista com
 * miniatura + categoria pra escolher, em vez de um <select> de texto puro.
 */
export function ProductPicker({
  products,
  value,
  onChange,
  placeholder = "Buscar produto pelo nome...",
}: {
  products: Product[];
  value: string;
  onChange: (productId: string) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = products.find((p) => p.id === value) ?? null;

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? products.filter((p) => p.name.toLowerCase().includes(q)) : products;
    return list.slice(0, 8);
  }, [products, query]);

  function handleSelect(product: Product) {
    onChange(product.id);
    setQuery("");
    setFocused(false);
  }

  function handleClear() {
    onChange("");
    setQuery("");
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  if (selected) {
    return (
      <div className="flex items-center gap-2.5 rounded-lg border border-input py-1.5 pr-2 pl-2.5">
        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted/50">
          {selected.image_url ? (
            <Image src={selected.image_url} alt="" fill className="object-contain p-1" unoptimized />
          ) : (
            <Package className="h-4 w-4 text-muted-foreground/40" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{selected.name}</p>
          {selected.category && <p className="truncate text-xs text-muted-foreground">{selected.category}</p>}
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Trocar produto"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        placeholder={placeholder}
        autoComplete="off"
        className="h-9 w-full rounded-lg border border-input bg-transparent pr-3 pl-9 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      {focused && (
        <div className="absolute top-full left-0 z-50 mt-1.5 max-h-64 w-full overflow-y-auto rounded-lg border bg-popover p-1.5 text-popover-foreground shadow-md ring-1 ring-foreground/10">
          {results.length === 0 ? (
            <p className="px-2 py-4 text-center text-sm text-muted-foreground">Produto não encontrado.</p>
          ) : (
            results.map((product) => (
              <button
                type="button"
                key={product.id}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(product)}
                className="flex w-full items-center gap-2.5 rounded-md p-2 text-left hover:bg-accent"
              >
                <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted/50">
                  {product.image_url ? (
                    <Image src={product.image_url} alt="" fill className="object-contain p-1" unoptimized />
                  ) : (
                    <Package className="h-4 w-4 text-muted-foreground/40" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{product.name}</p>
                  {product.category && <p className="truncate text-xs text-muted-foreground">{product.category}</p>}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
