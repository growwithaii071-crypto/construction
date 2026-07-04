import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In — Construction Co.",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse bg-gray-50 rounded-xl" />}>
      <LoginForm />
    </Suspense>
  );
}
