import { requireAuth } from "@/lib/auth-utils";
import { ClientForm } from "@/components/clients/client-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "New Client" };

export default async function NewClientPage() {
  await requireAuth();
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/clients">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">New Client</h1>
      </div>
      <ClientForm />
    </div>
  );
}
