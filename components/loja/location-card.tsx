"use client";

import { Refrigerator, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function LocationCard({
  name,
  totalItems,
  active,
  onSelect,
  compact = false,
}: {
  name: string;
  totalItems: number;
  active: boolean;
  onSelect: () => void;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "flex items-center gap-2 rounded-xl border-2 bg-card p-2 text-left transition-colors",
          active ? "border-primary bg-primary/5" : "border-transparent ring-1 ring-border hover:border-border"
        )}
      >
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            active ? "bg-primary text-primary-foreground" : "bg-accent text-gold"
          )}
        >
          {active ? <Check className="h-4 w-4" /> : <Refrigerator className="h-4 w-4" />}
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs leading-tight font-semibold">{name}</p>
          <p className="truncate text-[10px] leading-tight text-muted-foreground">{totalItems} itens</p>
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex flex-col gap-3 rounded-2xl border-2 bg-card p-4 text-left transition-colors",
        active ? "border-primary" : "border-transparent ring-1 ring-border hover:border-border"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent">
          <Refrigerator className="h-5 w-5 text-gold" />
        </span>
        {active && (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
            <Check className="h-3 w-3" />
            Selecionado
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{name}</p>
        <p className="text-xs text-muted-foreground">{totalItems} Itens Disponíveis</p>
      </div>
    </button>
  );
}
