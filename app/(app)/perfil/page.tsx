import { requireUser } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { EditProfileForm } from "@/components/edit-profile-form";
import { formatDate } from "@/lib/format";

export default async function PerfilPage() {
  const { email, profile } = await requireUser();

  const initials = profile.full_name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Perfil</h1>
        <p className="text-muted-foreground">Suas informações de cadastro no controle das geladeiras.</p>
      </div>

      <Card>
        <CardHeader className="flex-row items-center gap-4 space-y-0">
          <Avatar className="h-14 w-14">
            <AvatarFallback className="bg-primary text-lg text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="font-heading text-lg">{profile.full_name}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              {email}
              <Badge variant={profile.role === "admin" ? "default" : "secondary"}>
                {profile.role === "admin" ? "Administrador" : "Usuário"}
              </Badge>
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Separator />
          <EditProfileForm
            fullName={profile.full_name}
            courseNumber={profile.course_number}
            platoon={profile.platoon}
          />
          <Separator />
          <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">Membro desde</dt>
              <dd className="font-medium">{formatDate(profile.created_at)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd className="font-medium">{profile.is_active ? "Ativo" : "Inativo"}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
