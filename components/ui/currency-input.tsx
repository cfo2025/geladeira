"use client";

import { useId, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function centsToDisplay(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Campo de valor monetário com máscara "R$ XX,XX": o usuário digita apenas
 * dígitos (tratados como centavos) e o campo formata em tempo real. O valor
 * numérico (ex: "4.50") vai num input hidden com o `name` informado, para
 * uso direto em Server Actions via FormData.
 */
export function CurrencyInput({
  name,
  defaultValue = 0,
  disabled,
  required,
  className,
  id,
}: {
  name: string;
  defaultValue?: number;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  id?: string;
}) {
  const [cents, setCents] = useState(() => Math.round(defaultValue * 100));
  const autoId = useId();
  const inputId = id ?? autoId;

  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-xs font-medium text-muted-foreground">
        R$
      </span>
      <Input
        id={inputId}
        inputMode="numeric"
        autoComplete="off"
        value={centsToDisplay(cents)}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "");
          setCents(digits ? parseInt(digits, 10) : 0);
        }}
        disabled={disabled}
        className={cn("pl-8 text-right tabular-nums", className)}
      />
      <input type="hidden" name={name} value={(cents / 100).toFixed(2)} required={required} />
    </div>
  );
}
