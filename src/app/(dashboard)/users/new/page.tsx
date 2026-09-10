import { requireAuth } from "@/lib/auth-utils";
import { UserRole } from "@/generated/prisma";
import prisma from "@/lib/prisma";
import { ensureDefaultStaffRoles } from "@/lib/staff-roles";
import { NewUserForm } from "@/components/admin/new-user-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Add User" };

export default async function NewUserPage() {
  await requireAuth([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
  await ensureDefaultStaffRoles();

  const roles = await prisma.staffRole.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      baseRole: true,
      key: true,
    },
  });

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex items-center gap-3">
        <Link
          href="/users"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Add team member</h1>
          <p className="text-sm text-slate-500">
            Create Manager, Employee or any custom role user.{" "}
            <Link href="/roles" className="font-semibold text-orange-600 hover:underline">
              Manage roles →
            </Link>
          </p>
        </div>
      </div>

      <NewUserForm roles={roles} />
    </div>
  );
}
