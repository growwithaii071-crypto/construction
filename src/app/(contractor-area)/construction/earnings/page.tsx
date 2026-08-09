import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { DollarSign, TrendingUp, CheckCircle2, Clock, ArrowRight, IndianRupee } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Earnings — BuildPro Contractor" };

async function getEarningsData(userId: string) {
  try {
    const requests = await prisma.serviceRequest.findMany({
      where: { service: { contractorId: userId } },
      include: {
        service: { select: { title: true, category: true } },
        client: { select: { name: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    const completed = requests.filter((r) => r.status === "COMPLETED");
    const inProgress = requests.filter((r) => r.status === "IN_PROGRESS");
    const accepted = requests.filter((r) => r.status === "ACCEPTED");

    const totalEarned = completed.reduce((sum, r) => sum + (r.budget ?? 0), 0);
    const pendingEarnings = [...inProgress, ...accepted].reduce((sum, r) => sum + (r.budget ?? 0), 0);

    return { requests, completed, inProgress, accepted, totalEarned, pendingEarnings };
  } catch {
    return null;
  }
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  ACCEPTED: "bg-blue-50 text-blue-700 border-blue-200",
  IN_PROGRESS: "bg-violet-50 text-violet-700 border-violet-200",
  COMPLETED: "bg-green-50 text-green-700 border-green-200",
  REJECTED: "bg-red-50 text-red-600 border-red-200",
};

export default async function EarningsPage() {
  const session = await auth();
  const data = await getEarningsData(session?.user?.id ?? "");

  const stats = [
    {
      label: "Total Earned",
      value: `₹${(data?.totalEarned ?? 0).toLocaleString("en-IN")}`,
      sub: "From completed jobs",
      icon: IndianRupee,
      color: "green",
    },
    {
      label: "Pending Earnings",
      value: `₹${(data?.pendingEarnings ?? 0).toLocaleString("en-IN")}`,
      sub: "Active jobs in progress",
      icon: Clock,
      color: "amber",
    },
    {
      label: "Jobs Completed",
      value: data?.completed.length ?? 0,
      sub: "Successfully finished",
      icon: CheckCircle2,
      color: "blue",
    },
    {
      label: "Active Jobs",
      value: (data?.inProgress.length ?? 0) + (data?.accepted.length ?? 0),
      sub: "Currently ongoing",
      icon: TrendingUp,
      color: "orange",
    },
  ];

  const colorMap: Record<string, string> = {
    green: "bg-green-50 text-green-600",
    amber: "bg-amber-50 text-amber-600",
    blue: "bg-blue-50 text-blue-600",
    orange: "bg-orange-50 text-orange-600",
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track your revenue from completed and active jobs</p>
        </div>
        <Link href="/construction/requests"
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors shadow-sm">
          View Requests <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                  <p className="text-2xl font-extrabold text-gray-900 mt-1">{s.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
                </div>
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", colorMap[s.color])}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Completed jobs (earnings table) */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Completed Jobs</h2>
            <span className="text-xs bg-green-100 text-green-700 font-semibold px-2.5 py-1 rounded-full">
              {data?.completed.length ?? 0} jobs
            </span>
          </div>
          {!data?.completed.length ? (
            <div className="px-6 py-14 text-center">
              <IndianRupee className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No completed jobs yet</p>
              <p className="text-gray-300 text-xs mt-1">Earnings will appear here as jobs are completed</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="text-left text-xs font-semibold text-gray-400 pb-3 pt-2 px-6">Service</th>
                    <th className="text-left text-xs font-semibold text-gray-400 pb-3 pt-2 px-2">Customer</th>
                    <th className="text-right text-xs font-semibold text-gray-400 pb-3 pt-2 px-6">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.completed.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50/50">
                      <td className="py-3.5 px-6">
                        <p className="font-semibold text-gray-900 text-sm">{r.service.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{r.service.category}</p>
                      </td>
                      <td className="py-3.5 px-2">
                        <p className="text-sm text-gray-600">{r.client.name}</p>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        {r.budget ? (
                          <p className="font-bold text-green-600">₹{r.budget.toLocaleString("en-IN")}</p>
                        ) : (
                          <p className="text-gray-300 text-xs">—</p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-100 bg-green-50/30">
                    <td colSpan={2} className="px-6 py-3 text-sm font-bold text-gray-700">Total Earned</td>
                    <td className="px-6 py-3 text-right text-base font-extrabold text-green-600">
                      ₹{(data?.totalEarned ?? 0).toLocaleString("en-IN")}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Active / Pending earnings */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Upcoming Earnings</h2>
            <p className="text-xs text-gray-400 mt-0.5">From accepted & ongoing jobs</p>
          </div>
          {!data?.inProgress.length && !data?.accepted.length ? (
            <div className="px-5 py-10 text-center">
              <Clock className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No active jobs</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {[...(data?.accepted ?? []), ...(data?.inProgress ?? [])].map((r) => (
                <div key={r.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{r.service.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{r.client.name}</p>
                    </div>
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0", STATUS_STYLES[r.status])}>
                      {r.status === "IN_PROGRESS" ? "In Progress" : "Accepted"}
                    </span>
                  </div>
                  {r.budget ? (
                    <p className="text-sm font-bold text-amber-600 mt-1.5">₹{r.budget.toLocaleString("en-IN")}</p>
                  ) : (
                    <p className="text-xs text-gray-300 mt-1">No budget set</p>
                  )}
                </div>
              ))}
            </div>
          )}
          {(data?.pendingEarnings ?? 0) > 0 && (
            <div className="px-5 py-3 bg-amber-50 border-t border-amber-100">
              <p className="text-xs text-amber-600 font-medium">Estimated upcoming</p>
              <p className="text-base font-extrabold text-amber-700">₹{(data?.pendingEarnings ?? 0).toLocaleString("en-IN")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
