import Link from "next/link";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Plus, FolderKanban, Building2, User, Calendar, IndianRupee } from "lucide-react";
import { ProjectStatus } from "@/generated/prisma";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Projects" };

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  PLANNING: { label: "Planning", class: "bg-orange-100 text-orange-700 border-orange-200" },
  IN_PROGRESS: { label: "In Progress", class: "bg-blue-100 text-blue-700 border-blue-200" },
  ON_HOLD: { label: "On Hold", class: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  COMPLETED: { label: "Completed", class: "bg-green-100 text-green-700 border-green-200" },
  CANCELLED: { label: "Cancelled", class: "bg-red-100 text-red-700 border-red-200" },
};

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>;
}) {
  await requireAuth();
  const params = await searchParams;

  const where = {
    ...(params.status && params.status !== "ALL" ? { status: params.status as ProjectStatus } : {}),
    ...(params.search ? { name: { contains: params.search, mode: "insensitive" as const } } : {}),
  };

  const [projects, stats] = await Promise.all([
    prisma.project
      .findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          client: { select: { name: true } },
          manager: { select: { name: true } },
          _count: { select: { tasks: true, issues: true } },
        },
      })
      .catch(() => []),
    prisma.project.groupBy({ by: ["status"], _count: true }).catch(() => []),
  ]);

  const statusCounts = Object.fromEntries(stats.map((s) => [s.status, s._count]));

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500 mt-0.5">{projects.length} projects found</p>
        </div>
        <Button asChild className="bg-orange-500 hover:bg-orange-600">
          <Link href="/projects/new">
            <Plus className="w-4 h-4 mr-2" /> New Project
          </Link>
        </Button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { value: "ALL", label: "All", count: projects.length },
          ...Object.entries(STATUS_CONFIG).map(([value, cfg]) => ({
            value,
            label: cfg.label,
            count: statusCounts[value] ?? 0,
          })),
        ].map((tab) => (
          <Link
            key={tab.value}
            href={`/projects?status=${tab.value}${params.search ? `&search=${params.search}` : ""}`}
          >
            <button
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                (params.status ?? "ALL") === tab.value
                  ? "bg-[#0f2137] text-white"
                  : "bg-white border text-gray-600 hover:bg-gray-50"
              )}
            >
              {tab.label}
              <span
                className={cn(
                  "text-xs px-1.5 py-0.5 rounded-full",
                  (params.status ?? "ALL") === tab.value ? "bg-white/20" : "bg-gray-100"
                )}
              >
                {tab.count}
              </span>
            </button>
          </Link>
        ))}
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="text-center py-20">
          <FolderKanban className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No projects found</p>
          <p className="text-sm text-gray-400 mt-1">Create your first project to get started</p>
          <Button className="mt-6 bg-orange-500 hover:bg-orange-600" asChild>
            <Link href="/projects/new">
              <Plus className="w-4 h-4 mr-2" /> Create Project
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {projects.map((project) => {
            const sc = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.PLANNING;
            return (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="p-5 hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer h-full">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#0f2137] rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">
                          {project.code.slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm leading-tight">
                          {project.name}
                        </p>
                        <p className="text-xs text-gray-400">{project.code}</p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "px-2.5 py-1 rounded-full text-[11px] font-semibold border",
                        sc.class
                      )}
                    >
                      {sc.label}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    {project.client && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Building2 className="w-3.5 h-3.5" />
                        {project.client.name}
                      </div>
                    )}
                    {project.manager && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <User className="w-3.5 h-3.5" />
                        {project.manager.name}
                      </div>
                    )}
                    {project.endDate && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="w-3.5 h-3.5" />
                        Due {format(new Date(project.endDate), "dd MMM yyyy")}
                      </div>
                    )}
                    {project.budgetAmount > 0 && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <IndianRupee className="w-3.5 h-3.5" />
                        Budget: ₹{(project.budgetAmount / 100000).toFixed(1)}L
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Progress value={project.progress} className="flex-1 h-2" />
                    <span className="text-xs font-semibold text-gray-600 w-8 text-right">
                      {project.progress}%
                    </span>
                  </div>

                  <div className="flex gap-3 mt-3 pt-3 border-t">
                    <span className="text-xs text-gray-400">{project._count.tasks} tasks</span>
                    <span className="text-xs text-gray-400">{project._count.issues} issues</span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
