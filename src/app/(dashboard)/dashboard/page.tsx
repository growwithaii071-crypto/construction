import { requireAuth } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import { ProjectStatus, TaskStatus, InvoiceStatus, IssueStatus } from "@/generated/prisma";
import { StatsCard } from "@/components/dashboard/stats-card";
import { RecentProjects } from "@/components/dashboard/recent-projects";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { ProjectStatusChart } from "@/components/dashboard/project-status-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import {
  FolderKanban,
  Users,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  Clock,
  Building2,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

async function getDashboardData() {
  try {
    const [
      totalProjects,
      activeProjects,
      completedProjects,
      totalClients,
      totalUsers,
      openIssues,
      recentProjects,
      pendingInvoices,
      recentSiteReports,
      taskStats,
    ] = await Promise.all([
      prisma.project.count(),
      prisma.project.count({ where: { status: ProjectStatus.IN_PROGRESS } }),
      prisma.project.count({ where: { status: ProjectStatus.COMPLETED } }),
      prisma.client.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.issue.count({
        where: { status: { in: [IssueStatus.OPEN, IssueStatus.IN_PROGRESS] } },
      }),
      prisma.project.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { client: { select: { name: true } }, manager: { select: { name: true } } },
      }),
      prisma.invoice.findMany({
        where: {
          status: { in: [InvoiceStatus.SENT, InvoiceStatus.PARTIAL, InvoiceStatus.OVERDUE] },
        },
        take: 5,
        orderBy: { dueDate: "asc" },
        include: {
          client: { select: { name: true } },
          project: { select: { name: true, code: true } },
        },
      }),
      prisma.siteReport.findMany({
        take: 5,
        orderBy: { reportDate: "desc" },
        include: {
          project: { select: { name: true, code: true } },
          reporter: { select: { name: true } },
        },
      }),
      prisma.task.groupBy({ by: ["status"], _count: true }),
    ]);

    const totalRevenue = await prisma.invoice.aggregate({
      _sum: { paidAmount: true },
      where: { status: InvoiceStatus.PAID },
    });

    const pendingRevenue = await prisma.invoice.aggregate({
      _sum: { totalAmount: true },
      where: { status: { in: [InvoiceStatus.SENT, InvoiceStatus.PARTIAL] } },
    });

    return {
      stats: {
        totalProjects,
        activeProjects,
        completedProjects,
        totalClients,
        totalUsers,
        openIssues,
        totalRevenue: totalRevenue._sum.paidAmount ?? 0,
        pendingRevenue: pendingRevenue._sum.totalAmount ?? 0,
      },
      recentProjects,
      pendingInvoices,
      recentSiteReports,
      taskStats,
    };
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const session = await requireAuth();
  const data = await getDashboardData();

  if (!data) {
    return (
      <div className="p-6">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <p className="font-semibold text-amber-800">Database not connected</p>
          <p className="text-sm text-amber-600 mt-1">
            Please add your MongoDB Atlas connection string to{" "}
            <code className="bg-amber-100 px-1 rounded">.env.local</code>
          </p>
        </div>
      </div>
    );
  }

  const { stats, recentProjects, recentSiteReports, taskStats } = data;

  const completedTasks = taskStats.find((t) => t.status === TaskStatus.COMPLETED)?._count ?? 0;
  const inProgressTasks = taskStats.find((t) => t.status === TaskStatus.IN_PROGRESS)?._count ?? 0;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Good {getGreeting()}, {session.user.name?.split(" ")[0]}! 👋
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Here&apos;s what&apos;s happening with your projects today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Projects"
          value={stats.totalProjects}
          icon={FolderKanban}
          color="blue"
          sub={`${stats.activeProjects} active`}
          href="/projects"
        />
        <StatsCard
          title="Total Revenue"
          value={`₹${formatAmount(Number(stats.totalRevenue))}`}
          icon={TrendingUp}
          color="green"
          sub={`₹${formatAmount(Number(stats.pendingRevenue))} pending`}
          href="/invoices"
        />
        <StatsCard
          title="Clients"
          value={stats.totalClients}
          icon={Building2}
          color="purple"
          sub="Active clients"
          href="/clients"
        />
        <StatsCard
          title="Open Issues"
          value={stats.openIssues}
          icon={AlertTriangle}
          color={stats.openIssues > 5 ? "red" : "orange"}
          sub="Need attention"
          href="/issues"
        />
      </div>

      {/* Second row stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Completed"
          value={stats.completedProjects}
          icon={CheckCircle2}
          color="green"
          sub="Projects done"
          href="/projects"
        />
        <StatsCard
          title="Tasks Done"
          value={completedTasks}
          icon={CheckCircle2}
          color="blue"
          sub="Completed tasks"
        />
        <StatsCard
          title="In Progress"
          value={inProgressTasks}
          icon={Clock}
          color="orange"
          sub="Active tasks"
        />
        <StatsCard
          title="Team Members"
          value={stats.totalUsers}
          icon={Users}
          color="purple"
          sub="Active users"
          href="/users"
        />
      </div>

      {/* Charts + Recent Projects */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <RevenueChart />
        </div>
        <div>
          <ProjectStatusChart
            total={stats.totalProjects}
            active={stats.activeProjects}
            completed={stats.completedProjects}
            planning={stats.totalProjects - stats.activeProjects - stats.completedProjects}
          />
        </div>
      </div>

      {/* Recent Projects + Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <RecentProjects projects={recentProjects} />
        </div>
        <div>
          <RecentActivity reports={recentSiteReports} />
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Morning";
  if (h < 17) return "Afternoon";
  return "Evening";
}

function formatAmount(n: number) {
  if (n >= 10000000) return `${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return n.toString();
}
