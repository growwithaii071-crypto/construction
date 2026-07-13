import { Suspense } from "react";
import type { Metadata } from "next";
import { ContractorLoginForm } from "@/components/auth/contractor-login-form";

export const metadata: Metadata = {
  title: "Contractor Sign In — BuildPro",
};

export default function ConstructionLoginPage() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse bg-gray-50 rounded-xl" />}>
      <ContractorLoginForm />
    </Suspense>
  );
}
