import { requireAuth } from "@/lib/auth-utils";
import { ContractorForm } from "@/components/contractors/contractor-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NewContractorPage() {
  await requireAuth();
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/contractors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Add Contractor</h1>
      </div>
      <ContractorForm />
    </div>
  );
}
