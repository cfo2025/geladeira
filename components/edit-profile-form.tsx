"use client";

import { useActionState } from "react";
import { updateOwnProfile, type ActionResult } from "@/app/actions/profile";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function EditProfileForm({
  fullName,
  courseNumber,
  platoon,
}: {
  fullName: string;
  courseNumber: string;
  platoon: string;
}) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    updateOwnProfile,
    {}
  );

  useActionFeedback(state, { successMessage: "Dados atualizados" });

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="fullName">Nome de guerra</Label>
          <Input id="fullName" name="fullName" defaultValue={fullName} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="courseNumber">Nº de curso</Label>
          <Input id="courseNumber" name="courseNumber" defaultValue={courseNumber} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="platoon">Pelotão</Label>
          <Input id="platoon" name="platoon" defaultValue={platoon} required />
        </div>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Salvar alterações"}
      </Button>
    </form>
  );
}
