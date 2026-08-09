import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { BarChart3, TrendingUp, Award, Target, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Analytics — BuildPro Contractor" };

async function getAnalyticsData(userId: string) {
  try {
    const [services, requests] = await Promise.all([
      prisma.service.findMany({
        where: { contractorId: userId },
        include: { _count: { select: { requests: true } } },
      }),
      prisma.serviceRequest.findMany({
        where: { service: { contractorId: userId } },
        include: { service: { select: { title: true, category: true } } },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const total = requests.length;
    const completed = requests.filter((r) => r.status === "COMPLETED").length;
    const rejected = requests.filter((r) => r.status === "REJECTED").length;
    const inProgress = requests.filter((r) => r.status === "IN_PROGRESS").length;
    const accepted = requests.filter((r) => r.status === "ACCEPTED").length;
    const pending = requests.filter((r) => r.status === "PENDING").length;

    const conversionRate = total > 0 ? Math.round(((completed + inProgress + accepted) / total) * 100) : 0;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Category breakdown
    const categoryMap: Record<string, { total: number; completed: number }> = {};
    for (const r of requests) {
      const cat = r.service.category;
      if (!categoryMap[cat]) categoryMap[cat] = { total: 0, completed: 0 };
      categoryMap[cat].total++;
      if (r.status === "COMPLETED") categoryMap[cat].completed++;
    }

    // Most popular service
    const sortedServices = [...services].sort((a, b) => b._count.requests - a._count.requests);

    // Monthly stats (last 6 months)
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      return {
        label: d.toLocaleString("default", { month: "short" }),
        year: d.getFullYear(),
        month: d.getMonth(),
        count: 0,
        completed: 0,
      };
    });

    for (const r of requests) {
      const d = new Date(r.createdAt);
      const m = months.find((mo) => mo.month === d.getMonth() && mo.year === d.getFullYear());
      if (m) {
        m.count++;
        if (r.status === "COMPLETED") m.completed++;
      }
    }

    return {
      total, completed, rejected, inProgress, accepted, pending,
      conversionRate, completionRate,
      categoryMap, sortedServices, months,
    };
  } catch {
    return null;
  }
}

export default async function AnalyticsPage() {
  const session = await auth();
  const data = await getAnalyticsData(session?.user?.id ?? "");

  const maxMonthCount = Math.max(...(data?.months.map((m) => m.count) ?? [1]), 1);

  const kpis = [
    { label: "Total Requests", value: data?.total ?? 0, icon: Target, color: "blue", sub: "All time" },
    { label: "Conversion Rate", value: `${data?.conversionRate ?? 0}%`, icon: TrendingUp, color: "green", sub: "Accepted or active" },
    { label: "Completion Rate", value: `${data?.completionRate ?? 0}%`, icon: Award, color: "violet", sub: "Fully completed" },
    { label: "Active Jobs", value: (data?.inProgress ?? 0) + (data?.accepted ?? 0), icon: Zap, color: "orange", sub: "Right now" },
  ];

  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    violet: "bg-violet-50 text-violet-600",
    orange: "bg-orange-50 text-orange-600",
  };

  const statusItems = [
    { label: "Pending", count: data?.pending ?? 0, color: "bg-amber-400" },
    { label: "Accepted", count: data?.accepted ?? 0, color: "bg-blue-400" },
    { label: "In Progress", count: data?.inProgress ?? 0, color: "bg-violet-500" },
    { label: "Completed", count: data?.completed ?? 0, color: "bg-green-500" },
    { label: "Rejected", count: data?.rejected ?? 0, color: "bg-red-400" },
  ];
  const totalCount = data?.total || 1;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500 mt-0.5">Performance overview of your services and requests</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">{k.label}</p>
                  <p className="text-2xl font-extrabold text-gray-900 mt-1">{k.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{k.sub}</p>
                </div>
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", colorMap[k.color])}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly bar chart */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Requests Over Time</h2>
          <p className="text-xs text-gray-400 mb-6">Last 6 months</p>

          {data?.total === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-300">
              <BarChart3 className="w-12 h-12" />
            </div>
          ) : (
            <div className="flex items-end justify-between gap-3 h-48">
              {data?.months.map((m) => (
                <div key={`${m.label}-${m.year}`} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col items-center gap-1" style={{ height: "160px", justifyContent: "flex-end" }}>
                    {/* Completed layer */}
                    <div
                      className="w-full bg-green-400 rounded-t-sm"
                      style={{ height: `${Math.round((m.completed / maxMonthCount) * 100)}%`, minHeight: m.completed > 0 ? "4px" : "0" }}
                    />
                    {/* Total bar bg */}
                    <div
                      className="w-full bg-orange-200 rounded-t-sm"
                      style={{ height: `${Math.max(Math.round((m.count / maxMonthCount) * 100) - Math.round((m.completed / maxMonthCount) * 100), 0)}%`, minHeight: m.count > 0 ? "4px" : "0" }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 font-medium">{m.label}</p>
                  {m.count > 0 && <p className="text-xs font-bold text-gray-700">{m.count}</p>}
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-4 mt-4 border-t border-gray-50 pt-4">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-orange-200 rounded-sm" /><span className="text-xs text-gray-500">Requests</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-green-400 rounded-sm" /><span className="text-xs text-gray-500">Completed</span></div>
          </div>
        </div>

        {/* Status breakdown */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Request Status</h2>
          <p className="text-xs text-gray-400 mb-5">All time breakdown</p>

          <div className="space-y-3">
            {statusItems.map((s) => (
              <div key={s.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600 font-medium">{s.label}</span>
                  <span className="text-xs font-bold text-gray-900">{s.count}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full", s.color)}
                    style={{ width: `${Math.round((s.count / totalCount) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-50">
            <p className="text-xs text-gray-400 mb-3">Top Services by Requests</p>
            <div className="space-y-2">
              {data?.sortedServices.slice(0, 4).map((s, i) => (
                <div key={s.id} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-300 w-4">#{i + 1}</span>
                  <span className="text-xs text-gray-700 flex-1 truncate">{s.title}</span>
                  <span className="text-xs font-bold text-orange-500">{s._count.requests}</span>
                </div>
              ))}
              {!data?.sortedServices.length && (
                <p className="text-xs text-gray-300">No services yet</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Category breakdown */}
      {Object.keys(data?.categoryMap ?? {}).length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Performance by Category</h2>
          <p className="text-xs text-gray-400 mb-5">Requests and completion rate per service category</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(data?.categoryMap ?? {}).map(([cat, info]) => {
              const rate = info.total > 0 ? Math.round((info.completed / info.total) * 100) : 0;
              return (
                <div key={cat} className="border border-gray-100 rounded-xl p-4">
                  <p className="text-sm font-semibold text-gray-900 truncate">{cat}</p>
                  <p className="text-2xl font-extrabold text-orange-500 mt-1">{info.total}</p>
                  <p className="text-xs text-gray-400">requests</p>
                  <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-400 rounded-full" style={{ width: `${rate}%` }} />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{rate}% completed</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
