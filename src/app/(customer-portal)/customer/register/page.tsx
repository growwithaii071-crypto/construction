import type { Metadata } from "next";
import { Suspense } from "react";
import { CustomerRegisterForm } from "@/components/auth/customer-register-form";

export const metadata: Metadata = {
  title: "Customer Sign Up — BuildPro",
};

export default function CustomerRegisterPage() {
  return (
    <Suspense>
      <CustomerRegisterForm />
    </Suspense>
  );
}
