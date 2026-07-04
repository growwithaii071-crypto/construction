import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password — Construction Co.",
};

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) {
    redirect("/forgot-password");
  }

  return (
    <Suspense fallback={<div className="h-96 animate-pulse bg-gray-50 rounded-xl" />}>
      <ResetPasswordForm token={token} />
    </Suspense>
  );
}
