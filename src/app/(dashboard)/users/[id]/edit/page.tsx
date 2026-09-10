import { requireAuth } from "@/lib/auth-utils";
import { UserRole } from "@/generated/prisma";
import prisma from "@/lib/prisma";
import { ensureDefaultStaffRoles } from "@/lib/staff-roles";
import { notFound } from "next/navigation";
import { EditUserForm } from "@/components/admin/edit-user-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Edit User" };

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
  await ensureDefaultStaffRoles();
  const { id } = await params;

  const [user, roles] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        staffRoleId: true,
        isActive: true,
        staffRole: { select: { name: true } },
      },
    }),
    prisma.staffRole.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        baseRole: true,
        key: true,
        permissions: true,
      },
    }),
  ]);

  if (!user) notFound();

  const displayName = user.name || user.email;

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Link
            href="/users"
            className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500 text-xl font-bold text-white shadow-sm shadow-orange-500/25">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">{displayName}</h1>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                    user.isActive
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  )}
                >
                  {user.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-slate-500">
                {user.email}
                {user.staffRole?.name ? ` · ${user.staffRole.name}` : ""}
              </p>
            </div>
          </div>
        </div>
        <Link
          href="/roles"
          className="text-sm font-semibold text-orange-600 hover:underline sm:mt-2"
        >
          Manage roles →
        </Link>
      </div>

      <EditUserForm user={user} roles={roles} />
    </div>
  );
}
