import { requireAuth } from "@/lib/auth-utils";
import { UserRole } from "@/generated/prisma";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { EditRoleForm } from "@/components/admin/edit-role-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Edit Role" };

export default async function EditRolePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
  const { id } = await params;

  const role = await prisma.staffRole.findUnique({
    where: { id },
    include: { _count: { select: { users: true } } },
  });
  if (!role) notFound();

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Link
            href="/roles"
            className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500 text-xl font-bold text-white shadow-sm shadow-orange-500/25">
              {role.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">{role.name}</h1>
                {role.isSystem && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500">
                    Default
                  </span>
                )}
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                    role.isActive
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-600"
                  )}
                >
                  {role.isActive ? "Active" : "Off"}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-slate-500">
                {role._count.users} user{role._count.users === 1 ? "" : "s"} assigned
                {role.description ? ` · ${role.description}` : ""}
              </p>
            </div>
          </div>
        </div>
        <Link
          href="/users/new"
          className="text-sm font-semibold text-orange-600 hover:underline sm:mt-2"
        >
          Assign to user →
        </Link>
      </div>

      <EditRoleForm role={role} userCount={role._count.users} />
    </div>
  );
}
