import { Suspense } from "react";
import type { Metadata } from "next";
import { CustomerLoginForm } from "@/components/auth/customer-login-form";

export const metadata: Metadata = {
  title: "Customer Sign In — BuildPro",
};

export default function CustomerLoginPage() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse bg-gray-50 rounded-xl" />}>
      <CustomerLoginForm />
    </Suspense>
  );
}
