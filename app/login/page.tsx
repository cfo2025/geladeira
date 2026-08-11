import { Suspense } from "react";
import { AuthLayout } from "@/components/shell/auth-layout";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <AuthLayout>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
