import type { Metadata } from "next";
import { ContractorRegisterForm } from "@/components/auth/contractor-register-form";

export const metadata: Metadata = {
  title: "Contractor Sign Up — BuildPro",
};

export default function ConstructionRegisterPage() {
  return <ContractorRegisterForm />;
}
