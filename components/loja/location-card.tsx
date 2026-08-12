"use client";

import { Refrigerator, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function LocationCard({
  name,
  totalItems,
  active,
  onSelect,
}: {
  name: string;
  totalItems: number;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative flex items-center gap-3 rounded-2xl border-2 bg-card p-4 text-left transition-colors",
        active ? "border-primary" : "border-transparent ring-1 ring-border hover:border-border"
      )}
    >
      {active && (
        <span className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
          <Check className="h-3 w-3" />
          Selecionado
        </span>
      )}
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent">
        <Refrigerator className="h-5 w-5 text-gold" />
      </span>
      <span>
        <span className="block text-sm font-semibold">{name}</span>
        <span className="block text-xs text-muted-foreground">{totalItems} Itens Disponíveis</span>
      </span>
    </button>
  );
}
