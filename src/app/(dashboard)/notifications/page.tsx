import { requireAuth } from "@/lib/auth-utils";
import { UserRole } from "@/generated/prisma";
import prisma from "@/lib/prisma";
import { NotificationsList } from "@/components/notifications/notifications-list";
import { Bell } from "lucide-react";
import { AdminSearch } from "@/components/admin/admin-search";
import { CsvExportButton } from "@/components/admin/csv-export-button";
import type { Metadata } from "next";
import type { Prisma } from "@/generated/prisma";

export const metadata: Metadata = { title: "Notifications" };

export default async function AdminNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await requireAuth([
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.PROJECT_MANAGER,
    UserRole.SITE_ENGINEER,
    UserRole.FOREMAN,
    UserRole.ACCOUNTANT,
    UserRole.VIEWER,
  ]);
  const params = await searchParams;
  const q = (params.q ?? "").trim();

  const where: Prisma.NotificationWhereInput = {
    userId: session.user.id,
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { message: { contains: q, mode: "insensitive" } },
            { type: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const items = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const unread = items.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <Bell className="h-6 w-6 text-orange-500" />
            Notifications
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Marketplace activity, new requests, and system alerts
          </p>
        </div>
        <div className="flex gap-3 text-sm">
          <span className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-700 shadow-sm">
            {items.length} total
          </span>
          <span className="rounded-xl border border-orange-100 bg-orange-50 px-3 py-2 font-semibold text-orange-700">
            {unread} unread
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <AdminSearch
          basePath="/notifications"
          initialQuery={q}
          placeholder="Search notifications…"
        />
        <CsvExportButton resource="notifications" query={q} />
      </div>

      <NotificationsList items={items} />
    </div>
  );
}
