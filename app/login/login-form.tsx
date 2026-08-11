"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn, type ActionState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(signIn, null);
  const searchParams = useSearchParams();
  const inactiveError = searchParams.get("error") === "inactive";

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Loja Honesta</CardTitle>
        <CardDescription>Entre com seu e-mail e senha para acessar.</CardDescription>
      </CardHeader>
      <CardContent>
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
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
