"use client";

import { useActionState } from "react";
import { changePassword, type ActionState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthLayout } from "@/components/shell/auth-layout";
import { BrandMark } from "@/components/shell/brand-mark";

export default function TrocarSenhaPage() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    changePassword,
    null
  );

  return (
    <AuthLayout>
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-1 lg:hidden">
          <BrandMark tone="light" />
        </div>

        <div className="space-y-1.5">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Defina uma nova senha
          </h1>
          <p className="text-sm text-muted-foreground">
            Por segurança, você precisa trocar sua senha temporária antes de continuar.
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          {state?.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="password">Nova senha</Label>
            <Input id="password" name="password" type="password" required minLength={8} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={8}
            />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={pending}>
            {pending ? "Salvando..." : "Salvar e continuar"}
          </Button>
        </form>
      </div>
    </AuthLayout>
  );
}
