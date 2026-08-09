import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import {
  Wrench, ClipboardList, CheckCircle2, Clock, Plus, ArrowRight,
  AlertCircle, DollarSign, BarChart3, Star, FileText, Users, TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Contractor Dashboard — BuildPro" };

async function getContractorData(userId: string) {
  try {
    const [services, recentRequests, allRequests] = await Promise.all([
      prisma.service.findMany({
        where: { contractorId: userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { _count: { select: { requests: true } } },
      }),
      prisma.serviceRequest.findMany({
        where: { service: { contractorId: userId } },
        orderBy: { createdAt: "desc" },
        take: 6,
        include: {
          service: { select: { title: true } },
          client: { select: { name: true } },
        },
      }),
      prisma.serviceRequest.findMany({
        where: { service: { contractorId: userId } },
        select: { status: true, budget: true },
      }),
    ]);

    const totalServices = await prisma.service.count({ where: { contractorId: userId } });

    const pending = allRequests.filter((r) => r.status === "PENDING").length;
    const accepted = allRequests.filter((r) => r.status === "ACCEPTED").length;
    const inProgress = allRequests.filter((r) => r.status === "IN_PROGRESS").length;
    const completed = allRequests.filter((r) => r.status === "COMPLETED").length;
    const totalEarned = allRequests.filter((r) => r.status === "COMPLETED").reduce((s, r) => s + (r.budget ?? 0), 0);

    return {
      services, recentRequests, totalServices,
      totalRequests: allRequests.length, pending, accepted, inProgress, completed, totalEarned,
    };
  } catch {
    return null;
  }
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  ACCEPTED: "bg-blue-50 text-blue-700",
  IN_PROGRESS: "bg-violet-50 text-violet-700",
  COMPLETED: "bg-green-50 text-green-700",
  REJECTED: "bg-red-50 text-red-600",
};
const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
};

export default async function ContractorDashboardPage() {
  const session = await auth();
  const firstName = session?.user?.name?.split(" ")[0] ?? "there";
  const data = await getContractorData(session?.user?.id ?? "");

  const kpis = [
    { icon: Wrench, label: "Services", value: data?.totalServices ?? 0, color: "orange", href: "/construction/services" },
    { icon: ClipboardList, label: "Total Requests", value: data?.totalRequests ?? 0, color: "blue", href: "/construction/requests" },
    { icon: AlertCircle, label: "Pending", value: data?.pending ?? 0, color: "amber", href: "/construction/requests" },
    { icon: CheckCircle2, label: "Completed", value: data?.completed ?? 0, color: "green", href: "/construction/requests" },
  ];

  const colorMap: Record<string, string> = {
    orange: "bg-orange-50 text-orange-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    green: "bg-green-50 text-green-600",
    violet: "bg-violet-50 text-violet-600",
  };

  const quickActions = [
    { href: "/construction/services/new", label: "Add Service", icon: Plus, color: "orange", desc: "List a new service" },
    { href: "/construction/requests", label: "View Requests", icon: ClipboardList, color: "blue", desc: "Manage incoming jobs" },
    { href: "/construction/earnings", label: "Earnings", icon: DollarSign, color: "green", desc: "Track your revenue" },
    { href: "/construction/analytics", label: "Analytics", icon: BarChart3, color: "violet", desc: "Service performance" },
    { href: "/construction/reviews", label: "Reviews", icon: Star, color: "amber", desc: "Customer feedback" },
    { href: "/construction/invoices", label: "Invoices", icon: FileText, color: "blue", desc: "View all invoices" },
    { href: "/construction/team", label: "My Team", icon: Users, color: "orange", desc: "Manage workers" },
    { href: "/construction/profile", label: "Profile", icon: TrendingUp, color: "violet", desc: "Update your info" },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {firstName}! 👷</h1>
          <p className="text-gray-500 text-sm mt-1">Here&apos;s a summary of your business today.</p>
        </div>
        <Link href="/construction/services/new"
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Add Service
        </Link>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {kpis.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href}>
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", colorMap[stat.color])}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Earnings banner */}
      {(data?.totalEarned ?? 0) > 0 && (
        <div className="bg-linear-to-r from-green-500 to-emerald-600 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-green-100 text-sm font-medium">Total Earned (All Time)</p>
            <p className="text-3xl font-extrabold text-white mt-0.5">₹{(data?.totalEarned ?? 0).toLocaleString("en-IN")}</p>
          </div>
          <Link href="/construction/earnings" className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors">
            Details <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Quick Access</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((a) => {
            const Icon = a.icon;
            return (
              <Link key={a.href} href={a.href}
                className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 group">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", colorMap[a.color])}>
                  <Icon className="w-4 h-4" />
                </div>
                <p className="font-semibold text-gray-900 text-sm">{a.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{a.desc}</p>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Services */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">My Services</h2>
            <Link href="/construction/services" className="text-xs text-orange-600 font-semibold">View all →</Link>
          </div>
          {!data?.services.length ? (
            <div className="px-6 py-10 text-center">
              <Wrench className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No services added yet</p>
              <Link href="/construction/services/new" className="text-orange-500 text-sm font-semibold mt-2 inline-flex items-center gap-1 hover:text-orange-600">
                <Plus className="w-3.5 h-3.5" /> Add your first service
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {data.services.map((s) => (
                <div key={s.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{s.title}</p>
                    <p className="text-xs text-gray-400">{s.category} · {s._count.requests} requests</p>
                  </div>
                  <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", s.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500")}>
                    {s.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Requests */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Requests</h2>
            <Link href="/construction/requests" className="text-xs text-orange-600 font-semibold">View all →</Link>
          </div>
          {!data?.recentRequests.length ? (
            <div className="px-6 py-10 text-center">
              <ClipboardList className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No requests yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {data.recentRequests.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{r.client.name}</p>
                    <p className="text-xs text-gray-400">{r.service.title}</p>
                  </div>
                  <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", STATUS_STYLES[r.status] ?? "bg-gray-100 text-gray-500")}>
                    {STATUS_LABELS[r.status] ?? r.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status breakdown */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Request Status Breakdown</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Pending", count: data?.pending ?? 0, cls: "bg-amber-50 text-amber-700 border-amber-100" },
            { label: "Accepted", count: data?.accepted ?? 0, cls: "bg-blue-50 text-blue-700 border-blue-100" },
            { label: "In Progress", count: data?.inProgress ?? 0, cls: "bg-violet-50 text-violet-700 border-violet-100" },
            { label: "Completed", count: data?.completed ?? 0, cls: "bg-green-50 text-green-700 border-green-100" },
            { label: "All Requests", count: data?.totalRequests ?? 0, cls: "bg-gray-50 text-gray-700 border-gray-100" },
          ].map((s) => (
            <div key={s.label} className={cn("rounded-xl border p-4 text-center", s.cls)}>
              <p className="text-2xl font-extrabold">{s.count}</p>
              <p className="text-xs font-medium mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
