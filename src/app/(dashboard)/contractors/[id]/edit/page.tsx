import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { UserRole } from "@/generated/prisma";
import { EditContractorProfileForm } from "@/components/admin/edit-contractor-profile-form";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Edit Contractor Profile" };

function parseContractorMeta(avatar: string | null, fullName: string) {
  const personName = fullName.includes(" — ") ? fullName.split(" — ")[0] : fullName;
  let companyName = fullName.includes(" — ") ? fullName.split(" — ")[1] : "";
  let specialization = "";
  let licenseNumber = "";

  if (avatar?.startsWith("{")) {
    try {
      const meta = JSON.parse(avatar) as {
        companyName?: string;
        specialization?: string | string[];
        licenseNumber?: string;
      };
      if (meta.companyName) companyName = meta.companyName;
      if (Array.isArray(meta.specialization)) {
        specialization = meta.specialization.join(", ");
      } else if (typeof meta.specialization === "string") {
        specialization = meta.specialization;
      }
      if (meta.licenseNumber) licenseNumber = meta.licenseNumber;
    } catch {
      /* ignore */
    }
  }

  return { personName, companyName, specialization, licenseNumber };
}

export default async function EditContractorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.PROJECT_MANAGER]);
  const { id } = await params;

  const user = await prisma.user.findFirst({
    where: { id, role: UserRole.CONTRACTOR },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatar: true,
      isActive: true,
    },
  });

  if (!user) notFound();

  const meta = parseContractorMeta(user.avatar, user.name);

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex items-center gap-3">
        <Link
          href="/contractors"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Edit contractor profile</h1>
          <p className="text-sm text-slate-500">{user.email}</p>
        </div>
      </div>

      <EditContractorProfileForm
        contractor={{
          id: user.id,
          personName: meta.personName,
          companyName: meta.companyName || "Company",
          email: user.email,
          phone: user.phone,
          specialization: meta.specialization,
          licenseNumber: meta.licenseNumber,
          isActive: user.isActive,
        }}
      />
    </div>
  );
}
