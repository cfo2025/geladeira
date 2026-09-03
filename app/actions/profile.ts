"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/session";

export type ActionResult = { error?: string; success?: boolean };

const profileSchema = z.object({
  fullName: z.string().min(2, "Nome muito curto").max(150),
  courseNumber: z.string().min(1, "Informe o número do curso").max(30),
  platoon: z.string().min(1, "Informe o pelotão").max(30),
});

export async function updateOwnProfile(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const { userId } = await requireUser();

  const parsed = profileSchema.safeParse({
    fullName: formData.get("fullName"),
    courseNumber: formData.get("courseNumber"),
    platoon: formData.get("platoon"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      course_number: parsed.data.courseNumber,
      platoon: parsed.data.platoon,
    })
    .eq("id", userId);

  if (error) return { error: error.message };

  revalidatePath("/perfil", "layout");
  return { success: true };
}
