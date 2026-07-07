import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { ClientForm } from "@/components/clients/client-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const { id } = await params;
  const client = await prisma.client.findUnique({ where: { id } }).catch(() => null);
  if (!client) notFound();

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/clients/${id}`}>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Edit Client</h1>
      </div>
      <ClientForm client={client} />
    </div>
  );
}
