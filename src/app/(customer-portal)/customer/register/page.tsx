import type { Metadata } from "next";
import { CustomerRegisterForm } from "@/components/auth/customer-register-form";

export const metadata: Metadata = {
  title: "Customer Sign Up — BuildPro",
};

export default function CustomerRegisterPage() {
  return <CustomerRegisterForm />;
}
