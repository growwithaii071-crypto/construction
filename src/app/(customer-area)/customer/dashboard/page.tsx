import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import {
  Wrench,
  ClipboardList,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus,
  AlertCircle,
  Building2,
  Star,
  Mail,
  Phone,
  MapPin,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard — BuildPro Customer" };

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  ACCEPTED: "bg-blue-50 text-blue-700 border-blue-200",
  IN_PROGRESS: "bg-violet-50 text-violet-700 border-violet-200",
  COMPLETED: "bg-green-50 text-green-700 border-green-200",
  REJECTED: "bg-red-50 text-red-600 border-red-200",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
};

const STATUS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  PENDING: Clock,
  ACCEPTED: CheckCircle2,
  IN_PROGRESS: TrendingUp,
  COMPLETED: CheckCircle2,
  REJECTED: XCircle,
};

async function getCustomerDashboardData(userId: string, email: string) {
  try {
    const [requests, availableServices, recentRequests] = await Promise.all([
      prisma.serviceRequest.findMany({
        where: { clientId: userId },
        select: { status: true },
      }),
      prisma.service.count({ where: { isActive: true } }),
      prisma.serviceRequest.findMany({
        where: { clientId: userId },
        orderBy: { createdAt: "desc" },
        take: 6,
        include: {
          service: {
            select: {
              title: true,
              category: true,
              contractor: { select: { name: true } },
            },
          },
        },
      }),
    ]);

    const pending = requests.filter((r) => r.status === "PENDING").length;
    const accepted = requests.filter((r) => r.status === "ACCEPTED").length;
    const inProgress = requests.filter((r) => r.status === "IN_PROGRESS").length;
    const completed = requests.filter((r) => r.status === "COMPLETED").length;
    const rejected = requests.filter((r) => r.status === "REJECTED").length;

    return {
      total: requests.length,
      pending,
      accepted,
      inProgress,
      completed,
      rejected,
      availableServices,
      recentRequests,
    };
  } catch {
    return null;
  }
}

export default async function CustomerDashboardPage() {
  const session = await auth();
  const firstName = session?.user?.name?.split(" ")[0] ?? "there";
  const data = await getCustomerDashboardData(
    session?.user?.id ?? "",
    session?.user?.email ?? ""
  );

  const stats = [
    {
      label: "Total Requests",
      value: data?.total ?? 0,
      sub: "All time",
      icon: ClipboardList,
      color: "violet",
      href: "/customer/requests",
    },
    {
      label: "Pending",
      value: data?.pending ?? 0,
      sub: "Awaiting response",
      icon: Clock,
      color: "amber",
      href: "/customer/requests",
    },
    {
      label: "Active Jobs",
      value: (data?.accepted ?? 0) + (data?.inProgress ?? 0),
      sub: "In progress",
      icon: TrendingUp,
      color: "blue",
      href: "/customer/requests",
    },
    {
      label: "Completed",
      value: data?.completed ?? 0,
      sub: "Finished jobs",
      icon: CheckCircle2,
      color: "green",
      href: "/customer/requests",
    },
  ];

  const colorMap: Record<string, string> = {
    violet: "bg-violet-50 text-violet-600",
    amber: "bg-amber-50 text-amber-600",
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">

      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {firstName}!
            </h1>
          </div>
          <p className="text-sm text-gray-500 ml-10.5">
            Here&apos;s what&apos;s happening with your service requests.
          </p>
        </div>
        <Link
          href="/customer/services"
          className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Browse Services
        </Link>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href}>
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
                  </div>
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", colorMap[stat.color])}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* ── Main content grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Recent Requests table (2/3) ── */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-gray-400" />
              My Service Requests
            </h2>
            <Link href="/customer/requests" className="text-xs text-violet-600 hover:text-violet-700 font-semibold">
              View all →
            </Link>
          </div>

          {!data?.recentRequests.length ? (
            <div className="px-6 py-14 text-center">
              <AlertCircle className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium text-sm">No requests yet</p>
              <p className="text-gray-400 text-xs mt-1 mb-5">
                Browse services and request a contractor to get started.
              </p>
              <Link
                href="/customer/services"
                className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
              >
                <Wrench className="w-4 h-4" />
                Browse Services
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-semibold text-gray-400 pb-3 pt-1 px-6">Service</th>
                    <th className="text-left text-xs font-semibold text-gray-400 pb-3 pt-1 px-2">Contractor</th>
                    <th className="text-left text-xs font-semibold text-gray-400 pb-3 pt-1 px-2">Status</th>
                    <th className="text-right text-xs font-semibold text-gray-400 pb-3 pt-1 px-6">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.recentRequests.map((req) => {
                    const Icon = STATUS_ICONS[req.status] ?? Clock;
                    return (
                      <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3.5 px-6">
                          <p className="font-semibold text-gray-900 truncate max-w-[180px]">{req.service.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{req.service.category}</p>
                        </td>
                        <td className="py-3.5 px-2">
                          <p className="text-sm text-gray-600 truncate max-w-[140px]">
                            {req.service.contractor.name.split(" — ")[0]}
                          </p>
                        </td>
                        <td className="py-3.5 px-2">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border",
                            STATUS_STYLES[req.status]
                          )}>
                            <Icon className="w-3 h-3" />
                            {STATUS_LABELS[req.status]}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <Link
                            href="/customer/requests"
                            className="text-xs text-violet-600 hover:text-violet-700 font-semibold"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Quick Actions (1/3) ── */}
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-900 px-1">Quick Actions</h2>

          {[
            {
              href: "/customer/services",
              icon: Wrench,
              label: "Browse Services",
              desc: `${data?.availableServices ?? 0} services available`,
              color: "violet",
            },
            {
              href: "/customer/requests",
              icon: ClipboardList,
              label: "My Requests",
              desc: `${data?.total ?? 0} total requests`,
              color: "blue",
            },
            {
              href: "/customer/services",
              icon: Plus,
              label: "Post a New Job",
              desc: "Find a contractor quickly",
              color: "green",
            },
            {
              href: "/customer/profile",
              icon: Building2,
              label: "My Profile",
              desc: "Update account details",
              color: "gray",
            },
          ].map((action) => {
            const Icon = action.icon;
            const acColor: Record<string, string> = {
              violet: "bg-violet-50 text-violet-600",
              blue: "bg-blue-50 text-blue-600",
              green: "bg-green-50 text-green-600",
              gray: "bg-gray-50 text-gray-500",
            };
            return (
              <Link key={action.href + action.label} href={action.href}>
                <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", acColor[action.color])}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-800 group-hover:text-violet-600 transition-colors">
                        {action.label}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{action.desc}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Status breakdown ── */}
      {(data?.total ?? 0) > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-gray-400" />
            Request Status Breakdown
          </h2>
          <div className="space-y-3">
            {[
              { label: "Pending", count: data?.pending ?? 0, color: "bg-amber-400", textColor: "text-amber-700" },
              { label: "Accepted", count: data?.accepted ?? 0, color: "bg-blue-400", textColor: "text-blue-700" },
              { label: "In Progress", count: data?.inProgress ?? 0, color: "bg-violet-500", textColor: "text-violet-700" },
              { label: "Completed", count: data?.completed ?? 0, color: "bg-green-500", textColor: "text-green-700" },
              { label: "Rejected", count: data?.rejected ?? 0, color: "bg-red-400", textColor: "text-red-600" },
            ].map((row) => {
              const pct = data?.total ? (row.count / data.total) * 100 : 0;
              return (
                <div key={row.label} className="flex items-center gap-3">
                  <span className={cn("text-xs font-semibold w-24 shrink-0", row.textColor)}>
                    {row.label}
                  </span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", row.color)}
                      style={{ width: `${Math.max(pct, row.count > 0 ? 3 : 0)}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-700 w-6 text-right">{row.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Portal cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-violet-50 border border-violet-100 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center">
              <Wrench className="w-4 h-4 text-violet-600" />
            </div>
            <h3 className="font-semibold text-gray-800 text-sm">Available Services</h3>
          </div>
          <p className="text-2xl font-extrabold text-violet-600">{data?.availableServices ?? 0}</p>
          <p className="text-xs text-gray-500 mt-1 mb-3">Active services from contractors</p>
          <Link href="/customer/services" className="text-xs text-violet-600 hover:text-violet-700 font-semibold">
            Browse now →
          </Link>
        </div>

        <div className="bg-green-50 border border-green-100 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-800 text-sm">Jobs Completed</h3>
          </div>
          <p className="text-2xl font-extrabold text-green-600">{data?.completed ?? 0}</p>
          <p className="text-xs text-gray-500 mt-1 mb-3">Successfully finished projects</p>
          <Link href="/customer/requests" className="text-xs text-green-600 hover:text-green-700 font-semibold">
            View history →
          </Link>
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center">
              <Star className="w-4 h-4 text-amber-600" />
            </div>
            <h3 className="font-semibold text-gray-800 text-sm">Need Help?</h3>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed mb-3">
            Our support team is available Mon–Sat, 9AM–6PM IST.
          </p>
          <div className="space-y-1.5 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <Mail className="w-3 h-3 text-amber-500 shrink-0" />
              support@buildpro.in
            </div>
            <div className="flex items-center gap-1.5">
              <Phone className="w-3 h-3 text-amber-500 shrink-0" />
              +91 98765 43210
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
