import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { UserRole } from "@/generated/prisma";
import { EditClientProfileForm } from "@/components/admin/edit-client-profile-form";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Edit Client Profile" };

export default async function EditClientProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.PROJECT_MANAGER]);
  const { id } = await params;

  const client = await prisma.user.findFirst({
    where: { id, role: UserRole.CLIENT },
    select: { id: true, name: true, email: true, phone: true, isActive: true },
  });

  if (!client) notFound();

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex items-center gap-3">
        <Link
          href="/clients"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Edit client profile</h1>
          <p className="text-sm text-slate-500">{client.email}</p>
        </div>
      </div>

      <EditClientProfileForm client={client} />
    </div>
  );
}
