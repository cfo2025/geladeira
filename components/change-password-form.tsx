"use client";

import { useActionState, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { updateOwnPassword, type ActionResult } from "@/app/actions/profile";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleTrigger, CollapsiblePanel } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export function ChangePasswordForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    updateOwnPassword,
    {}
  );
  const formRef = useRef<HTMLFormElement>(null);

  useActionFeedback(state, {
    successMessage: "Senha atualizada",
    onSuccess: () => {
      formRef.current?.reset();
      setOpen(false);
    },
  });

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        render={
          <button
            type="button"
            className="flex w-full items-center justify-between text-left text-sm font-semibold"
          />
        }
      >
        Alterar senha
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsiblePanel>
        <form ref={formRef} action={formAction} className="space-y-4 pt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="password">Nova senha</Label>
              <Input id="password" name="password" type="password" required minLength={8} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" required minLength={8} />
            </div>
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando..." : "Alterar senha"}
          </Button>
        </form>
      </CollapsiblePanel>
    </Collapsible>
  );
}
