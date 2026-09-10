import { requireAuth } from "@/lib/auth-utils";
import { UserRole } from "@/generated/prisma";
import prisma from "@/lib/prisma";
import {
  ensureDefaultStaffRoles,
  STAFF_BASE_ROLE_LABELS,
  modulesFromPermissions,
  permissionLabel,
} from "@/lib/staff-roles";
import Link from "next/link";
import { Plus, Shield, Users, Pencil } from "lucide-react";
import { toggleStaffRoleAction } from "@/actions/roles";
import { cn } from "@/lib/utils";
import { AdminSearch } from "@/components/admin/admin-search";
import { CsvExportButton } from "@/components/admin/csv-export-button";
import type { Metadata } from "next";
import type { Prisma } from "@/generated/prisma";

export const metadata: Metadata = { title: "Roles" };

export default async function RolesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAuth([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
  await ensureDefaultStaffRoles();
  const params = await searchParams;
  const q = (params.q ?? "").trim();

  const where: Prisma.StaffRoleWhereInput = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { key: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const roles = await prisma.staffRole.findMany({
    where,
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    include: { _count: { select: { users: true } } },
  });

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Roles</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            See which modules each role can access · assign roles when adding users
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/users/new"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Users className="h-4 w-4" />
            Add user
          </Link>
          <Link
            href="/roles/new"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-orange-500 px-4 text-sm font-semibold text-white hover:bg-orange-600"
          >
            <Plus className="h-4 w-4" />
            Create role
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <AdminSearch
          basePath="/roles"
          initialQuery={q}
          placeholder="Search roles by name or description…"
        />
        <CsvExportButton resource="roles" query={q} />
      </div>

      {roles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
          <Shield className="mx-auto h-10 w-10 text-slate-200" />
          <p className="mt-3 font-medium text-slate-600">
            {q ? "No roles match your search" : "No roles yet"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {roles.map((role) => {
            const modules = modulesFromPermissions(role.permissions);
            return (
              <div
                key={role.id}
                className={cn(
                  "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm",
                  !role.isActive && "opacity-60"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                      <Shield className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-slate-900">{role.name}</p>
                        {role.isSystem && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                            Default
                          </span>
                        )}
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                            role.isActive
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-600"
                          )}
                        >
                          {role.isActive ? "Active" : "Off"}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {role.description || "No description"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-1 text-xs text-slate-500">
                  <p>
                    Access level:{" "}
                    <span className="font-semibold text-slate-800">
                      {STAFF_BASE_ROLE_LABELS[role.baseRole] ?? role.baseRole}
                    </span>
                    {" · "}
                    Users:{" "}
                    <span className="font-semibold text-slate-800">{role._count.users}</span>
                  </p>
                </div>

                <div className="mt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Modules assigned
                  </p>
                  {modules.length === 0 ? (
                    <p className="mt-2 text-xs text-slate-400">No modules selected</p>
                  ) : (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {modules.map((m) => (
                        <span
                          key={m}
                          className="rounded-lg bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-orange-700"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Permissions
                  </p>
                  {role.permissions.length === 0 ? (
                    <p className="mt-2 text-xs text-slate-400">None</p>
                  ) : (
                    <ul className="mt-2 space-y-1">
                      {role.permissions.map((key) => (
                        <li
                          key={key}
                          className="flex items-center gap-2 text-xs text-slate-600"
                        >
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                          {permissionLabel(key)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <Link
                    href={`/roles/${role.id}/edit`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit modules
                  </Link>
                  {!role.isSystem && (
                    <form action={toggleStaffRoleAction.bind(null, role.id, !role.isActive)}>
                      <button
                        type="submit"
                        className="text-xs font-medium text-slate-500 hover:text-slate-800"
                      >
                        {role.isActive ? "Disable" : "Enable"}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
