"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PixInfo({ pixKey, receiverName }: { pixKey: string; receiverName: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(pixKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
      <p className="text-sm text-muted-foreground">Chave Pix ({receiverName})</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 truncate rounded bg-background px-3 py-2 text-sm">{pixKey}</code>
        <Button type="button" variant="outline" size="icon" onClick={handleCopy}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Faça o Pix manualmente para esta chave e depois declare abaixo o valor pago.
      </p>
    </div>
  );
}
