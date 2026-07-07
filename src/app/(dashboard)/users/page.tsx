import Link from "next/link";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Mail, Phone, Shield, ToggleLeft, ToggleRight } from "lucide-react";
import { ROLE_LABELS } from "@/lib/auth-utils";
import { UserRole } from "@/generated/prisma";
import { cn } from "@/lib/utils";
import { toggleUserActiveAction } from "@/actions/users";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Users" };

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-700",
  PROJECT_MANAGER: "bg-blue-100 text-blue-700",
  SITE_ENGINEER: "bg-purple-100 text-purple-700",
  FOREMAN: "bg-orange-100 text-orange-700",
  ACCOUNTANT: "bg-green-100 text-green-700",
  VIEWER: "bg-gray-100 text-gray-500",
};

export default async function UsersPage() {
  await requireAuth([UserRole.ADMIN, UserRole.PROJECT_MANAGER]);

  const users = await prisma.user
    .findMany({
      orderBy: [{ role: "asc" }, { name: "asc" }],
    })
    .catch(() => []);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
          <p className="text-sm text-gray-500">
            {users.filter((u) => u.isActive).length} active · {users.length} total
          </p>
        </div>
        <Button asChild className="bg-orange-500 hover:bg-orange-600">
          <Link href="/users/new">
            <Plus className="w-4 h-4 mr-2" /> Add User
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {users.map((user) => (
          <Card
            key={user.id}
            className={cn("p-5 transition-opacity", !user.isActive && "opacity-60")}
          >
            <div className="flex items-start gap-4">
              <Avatar className="w-12 h-12 flex-shrink-0">
                <AvatarFallback className="bg-[#1e3a5f] text-white font-bold text-lg">
                  {user.name?.charAt(0) ?? "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-gray-900 truncate">{user.name}</p>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0",
                      ROLE_COLORS[user.role] ?? "bg-gray-100"
                    )}
                  >
                    {ROLE_LABELS[user.role as UserRole]}
                  </span>
                </div>
                <div className="mt-1.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 truncate">
                    <Mail className="w-3 h-3 flex-shrink-0" />
                    {user.email}
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Phone className="w-3 h-3" />
                      {user.phone}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-4 pt-3 border-t">
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Shield className="w-3 h-3" />
                {user.emailVerified ? "Verified" : "Unverified"}
              </div>
              <form action={toggleUserActiveAction.bind(null, user.id, !user.isActive)}>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
                >
                  {user.isActive ? (
                    <>
                      <ToggleRight className="w-4 h-4 text-green-500" /> Active
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4 text-gray-300" /> Inactive
                    </>
                  )}
                </button>
              </form>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
