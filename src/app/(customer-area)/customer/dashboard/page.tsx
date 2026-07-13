import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import {
  FolderKanban,
  Clock,
  CheckCircle2,
  Receipt,
  AlertTriangle,
  ArrowRight,
  Building2,
  Phone,
  Mail,
  HardHat,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Dashboard — BuildPro Customer" };

async function getCustomerData(email: string) {
  try {
    const client = await prisma.client.findFirst({
      where: { email },
      include: {
        projects: {
          orderBy: { createdAt: "desc" },
          take: 5,
          include: {
            manager: { select: { name: true } },
          },
        },
      },
    });

    if (!client) return null;

    const totalProjects = client.projects.length;
    const activeProjects = client.projects.filter((p) => p.status === "IN_PROGRESS").length;
    const completedProjects = client.projects.filter((p) => p.status === "COMPLETED").length;

    return { client, totalProjects, activeProjects, completedProjects };
  } catch {
    return null;
  }
}

const STATUS_COLORS: Record<string, string> = {
  PLANNING: "bg-gray-100 text-gray-600",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  ON_HOLD: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-600",
};

const STATUS_LABELS: Record<string, string> = {
  PLANNING: "Planning",
  IN_PROGRESS: "In Progress",
  ON_HOLD: "On Hold",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export default async function CustomerDashboardPage() {
  const session = await auth();
  const firstName = session?.user?.name?.split(" ")[0] ?? "there";
  const data = await getCustomerData(session?.user?.email ?? "");

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {firstName}! 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Track your construction projects and stay updated in real-time.
          </p>
        </div>
        <Link
          href="/customer/services"
          className="shrink-0 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors shadow-sm"
        >
          Browse Services
        </Link>
      </div>

      {data ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                icon: FolderKanban,
                label: "Total Projects",
                value: data.totalProjects,
                color: "blue",
              },
              {
                icon: Clock,
                label: "In Progress",
                value: data.activeProjects,
                color: "orange",
              },
              {
                icon: CheckCircle2,
                label: "Completed",
                value: data.completedProjects,
                color: "green",
              },
              {
                icon: Receipt,
                label: "Invoices",
                value: 0,
                color: "purple",
              },
            ].map((stat) => {
              const Icon = stat.icon;
              const colorMap: Record<string, string> = {
                blue: "bg-blue-50 text-blue-600",
                orange: "bg-orange-50 text-orange-600",
                green: "bg-green-50 text-green-600",
                purple: "bg-purple-50 text-purple-600",
              };
              return (
                <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
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
              );
            })}
          </div>

          {/* Projects list */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Your Projects</h2>
            </div>

            {data.client.projects.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <FolderKanban className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium text-sm">No projects yet</p>
                <p className="text-gray-400 text-xs mt-1">
                  Your assigned projects will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {data.client.projects.map((project) => (
                  <div key={project.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5 mb-0.5">
                        <span className="text-xs font-mono text-gray-400">{project.code}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[project.status] ?? "bg-gray-100 text-gray-600"}`}>
                          {STATUS_LABELS[project.status] ?? project.status}
                        </span>
                      </div>
                      <p className="font-semibold text-gray-900 text-sm truncate">{project.name}</p>
                      {project.manager && (
                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                          <HardHat className="w-3 h-3" />
                          Manager: {project.manager.name}
                        </p>
                      )}
                    </div>
                    <div className="text-right ml-4 shrink-0">
                      <p className="text-xs text-gray-400">
                        {project.endDate
                          ? new Date(project.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                          : "No deadline"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Client info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Your Account Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-3 text-gray-600">
                <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                <span>{data.client.company ?? data.client.name}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="truncate">{data.client.email}</span>
              </div>
              {data.client.phone && (
                <div className="flex items-center gap-3 text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>{data.client.phone}</span>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        /* No client record yet — show welcome card */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Building2 className="w-8 h-8 text-blue-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome to BuildPro!</h2>
          <p className="text-gray-500 text-sm max-w-md mx-auto mb-6 leading-relaxed">
            Your account is set up. Our team will link your projects to this portal shortly. 
            You&apos;ll be able to track progress, view invoices, and communicate with your 
            construction team right here.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              No projects assigned yet
            </div>
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-semibold"
            >
              Back to home <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
