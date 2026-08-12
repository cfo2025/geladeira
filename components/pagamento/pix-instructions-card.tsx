"use client";

import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { Copy, Check, QrCode } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PixInstructionsCard({
  pixKey,
  qrCodeUrl,
}: {
  pixKey: string | undefined;
  qrCodeUrl: string | undefined;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!pixKey) return;
    await navigator.clipboard.writeText(pixKey);
    setCopied(true);
    toast.success("Chave Pix copiada");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Instruções para Pagamento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="relative mx-auto flex aspect-square w-full max-w-56 items-center justify-center overflow-hidden rounded-xl border bg-muted/40">
          {qrCodeUrl ? (
            <Image src={qrCodeUrl} alt="QR Code Pix" fill className="object-contain p-3" unoptimized />
          ) : (
            <div className="flex flex-col items-center gap-2 p-6 text-center">
              <QrCode className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">QR Code ainda não configurado</p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Chave Pix</label>
          {pixKey ? (
            <div className="flex items-center gap-2">
              <Input readOnly value={pixKey} className="truncate font-mono text-sm" />
              <Button type="button" variant="outline" size="icon" onClick={handleCopy} aria-label="Copiar Chave Pix">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Chave Pix ainda não configurada. Procure a administração.
            </p>
          )}
          {pixKey && (
            <Button type="button" variant="secondary" size="sm" className="w-full" onClick={handleCopy}>
              {copied ? "Chave copiada" : "Copiar Chave Pix"}
            </Button>
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          Após realizar o envio do Pix no seu banco, declare o valor exato no formulário ao lado
          para validação.
        </p>
      </CardContent>
    </Card>
  );
}
