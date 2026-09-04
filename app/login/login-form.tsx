"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn, type ActionState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BrandMark } from "@/components/shell/brand-mark";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(signIn, null);
  const searchParams = useSearchParams();
  const inactiveError = searchParams.get("error") === "inactive";

  return (
    <div className="w-full max-w-sm space-y-8">
      <div className="space-y-4 lg:hidden">
        <BrandMark tone="light" />
        <div className="space-y-2">
          <p className="font-heading text-xl leading-tight font-semibold text-balance">
            Ajude a manter nossas geladeiras organizadas.
          </p>
          <p className="text-sm text-muted-foreground">
            Registre o que você colocou nas geladeiras e o que retirou, para sabermos sempre o
            que tem e de quem é.
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Bem-vindo(a) de volta</h1>
        <p className="text-sm text-muted-foreground">Entre com seu e-mail e senha para acessar.</p>
      </div>

      <form action={formAction} className="space-y-4">
        {(state?.error || inactiveError) && (
          <Alert variant="destructive">
            <AlertDescription>
              {inactiveError
                ? "Sua conta está desativada. Procure a administração."
                : state?.error}
            </AlertDescription>
          </Alert>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={pending}>
          {pending ? "Entrando..." : "Entrar"}
        </Button>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        Não tem uma conta? Procure um administrador da turma para receber seu acesso.
      </p>
    </div>
  );
}
