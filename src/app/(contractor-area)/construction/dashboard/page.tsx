import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Wrench, ClipboardList, CheckCircle2, Clock, Plus, ArrowRight, AlertCircle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Contractor Dashboard — BuildPro" };

async function getContractorData(userId: string) {
  try {
    const [services, requests] = await Promise.all([
      prisma.service.findMany({
        where: { contractorId: userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { _count: { select: { requests: true } } },
      }),
      prisma.serviceRequest.findMany({
        where: { service: { contractorId: userId }, status: "PENDING" },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          service: { select: { title: true } },
          client: { select: { name: true, email: true } },
        },
      }),
    ]);

    const totalServices = await prisma.service.count({ where: { contractorId: userId } });
    const totalRequests = await prisma.serviceRequest.count({ where: { service: { contractorId: userId } } });
    const pendingRequests = await prisma.serviceRequest.count({ where: { service: { contractorId: userId }, status: "PENDING" } });
    const completedRequests = await prisma.serviceRequest.count({ where: { service: { contractorId: userId }, status: "COMPLETED" } });

    return { services, requests, totalServices, totalRequests, pendingRequests, completedRequests };
  } catch {
    return null;
  }
}

export default async function ContractorDashboardPage() {
  const session = await auth();
  const firstName = session?.user?.name?.split(" ")[0] ?? "there";
  const data = await getContractorData(session?.user?.id ?? "");

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {firstName}! 👷</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your services and customer requests.</p>
        </div>
        <Link
          href="/construction/services/new"
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Service
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: Wrench, label: "Total Services", value: data?.totalServices ?? 0, color: "orange", href: "/construction/services" },
          { icon: ClipboardList, label: "Total Requests", value: data?.totalRequests ?? 0, color: "blue", href: "/construction/requests" },
          { icon: AlertCircle, label: "Pending", value: data?.pendingRequests ?? 0, color: "amber", href: "/construction/requests" },
          { icon: CheckCircle2, label: "Completed", value: data?.completedRequests ?? 0, color: "green", href: "/construction/requests" },
        ].map((stat) => {
          const Icon = stat.icon;
          const colorMap: Record<string, string> = {
            orange: "bg-orange-50 text-orange-600",
            blue: "bg-blue-50 text-blue-600",
            amber: "bg-amber-50 text-amber-600",
            green: "bg-green-50 text-green-600",
          };
          return (
            <Link key={stat.label} href={stat.href}>
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colorMap[stat.color]}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
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
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {s.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Requests */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">New Requests</h2>
            <Link href="/construction/requests" className="text-xs text-orange-600 font-semibold">View all →</Link>
          </div>
          {!data?.requests.length ? (
            <div className="px-6 py-10 text-center">
              <ClipboardList className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No pending requests</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {data.requests.map((r) => (
                <div key={r.id} className="px-6 py-3.5 hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-gray-800 text-sm">{r.client.name}</p>
                    <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">Pending</span>
                  </div>
                  <p className="text-xs text-gray-400">{r.service.title}</p>
                  {r.message && <p className="text-xs text-gray-500 mt-1 line-clamp-1">"{r.message}"</p>}
                  <Link href="/construction/requests" className="text-xs text-orange-500 font-semibold mt-1.5 inline-flex items-center gap-0.5 hover:text-orange-600">
                    Review <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
