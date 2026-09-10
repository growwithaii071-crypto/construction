import Link from "next/link";
import prisma from "@/lib/prisma";
import { requireAuth, ROLE_LABELS } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Mail, Phone, Shield, ToggleLeft, ToggleRight } from "lucide-react";
import { UserRole } from "@/generated/prisma";
import { cn } from "@/lib/utils";
import { toggleUserActiveAction } from "@/actions/users";
import { AdminSearch } from "@/components/admin/admin-search";
import { CsvExportButton } from "@/components/admin/csv-export-button";
import type { Metadata } from "next";
import type { Prisma } from "@/generated/prisma";

export const metadata: Metadata = { title: "Users" };

const STAFF_ROLES: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.PROJECT_MANAGER,
  UserRole.SITE_ENGINEER,
  UserRole.FOREMAN,
  UserRole.ACCOUNTANT,
  UserRole.VIEWER,
];

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "bg-purple-100 text-purple-700",
  ADMIN: "bg-red-100 text-red-700",
  PROJECT_MANAGER: "bg-blue-100 text-blue-700",
  SITE_ENGINEER: "bg-violet-100 text-violet-700",
  FOREMAN: "bg-orange-100 text-orange-700",
  ACCOUNTANT: "bg-green-100 text-green-700",
  VIEWER: "bg-gray-100 text-gray-500",
};

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAuth([UserRole.ADMIN, UserRole.PROJECT_MANAGER]);
  const params = await searchParams;
  const q = (params.q ?? "").trim();

  const where: Prisma.UserWhereInput = {
    role: { in: STAFF_ROLES },
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
            { staffRole: { name: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const users = await prisma.user
    .findMany({
      where,
      orderBy: [{ role: "asc" }, { name: "asc" }],
      include: { staffRole: { select: { name: true, key: true } } },
    })
    .catch(() => []);

  const activeCount = users.filter((u) => u.isActive).length;

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
          <p className="text-sm text-gray-500">
            Staff accounts only · {activeCount} active · {users.length}{" "}
            {q ? "matching" : "total"}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Roles →{" "}
            <Link href="/roles" className="text-orange-600 hover:underline">
              /roles
            </Link>
            {" · "}
            Clients →{" "}
            <Link href="/clients" className="text-blue-600 hover:underline">
              /clients
            </Link>
            {" · "}
            Contractors →{" "}
            <Link href="/contractors" className="text-orange-600 hover:underline">
              /contractors
            </Link>
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/roles">Manage Roles</Link>
          </Button>
          <Button asChild className="bg-orange-500 hover:bg-orange-600">
            <Link href="/users/new">
              <Plus className="mr-2 h-4 w-4" /> Add User
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <AdminSearch
          basePath="/users"
          initialQuery={q}
          placeholder="Search by name, email, phone or role…"
        />
        <CsvExportButton resource="users" query={q} />
      </div>

      {users.length === 0 ? (
        <Card className="p-14 text-center">
          <p className="font-medium text-gray-600">
            {q ? "No team members match your search" : "No staff users yet"}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {users.map((user) => (
            <Card
              key={user.id}
              className={cn("p-5 transition-opacity", !user.isActive && "opacity-60")}
            >
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12 shrink-0">
                  <AvatarFallback className="bg-[#1e3a5f] text-lg font-bold text-white">
                    {user.name?.charAt(0) ?? "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-semibold text-gray-900">{user.name}</p>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        ROLE_COLORS[user.role] ?? "bg-orange-100 text-orange-700"
                      )}
                    >
                      {user.staffRole?.name ?? ROLE_LABELS[user.role as UserRole]}
                    </span>
                  </div>
                  <div className="mt-1.5 space-y-1">
                    <div className="flex items-center gap-1.5 truncate text-xs text-gray-500">
                      <Mail className="h-3 w-3 shrink-0" />
                      {user.email}
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Phone className="h-3 w-3" />
                        {user.phone}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t pt-3">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Shield className="h-3 w-3" />
                  {user.emailVerified ? "Verified" : "Unverified"}
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href={`/users/${user.id}/edit`}
                    className="text-xs font-medium text-blue-600 hover:underline"
                  >
                    Edit
                  </Link>
                  <form action={toggleUserActiveAction.bind(null, user.id, !user.isActive)}>
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 text-xs font-medium text-gray-500 transition-colors hover:text-gray-900"
                    >
                      {user.isActive ? (
                        <>
                          <ToggleRight className="h-4 w-4 text-green-500" /> Active
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="h-4 w-4 text-gray-300" /> Inactive
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
