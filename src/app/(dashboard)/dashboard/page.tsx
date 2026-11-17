import { requireAuth } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import {
  TaskStatus,
  InvoiceStatus,
  IssueStatus,
  MarketplacePaymentStatus,
} from "@/generated/prisma";
import { StatsCard } from "@/components/dashboard/stats-card";
import { RecentProjects } from "@/components/dashboard/recent-projects";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { ProjectStatusChart } from "@/components/dashboard/project-status-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import {
  getMonthlyFinanceSeries,
  getProjectStatusCounts,
  getMarketplaceAdminStats,
} from "@/lib/dashboard-metrics";
import { formatMoney } from "@/lib/money";
import {
  FolderKanban,
  Users,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  Clock,
  Building2,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

async function getDashboardData() {
  try {
    const [
      projectStatus,
      totalClients,
      totalUsers,
      openIssues,
      recentProjects,
      recentSiteReports,
      taskStats,
      totalRevenue,
      pendingRevenue,
      monthly,
      market,
      recentPayments,
    ] = await Promise.all([
      getProjectStatusCounts(),
      prisma.client.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.issue.count({
        where: { status: { in: [IssueStatus.OPEN, IssueStatus.IN_PROGRESS] } },
      }),
      prisma.project.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          client: { select: { name: true } },
          manager: { select: { name: true } },
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
      prisma.invoice.aggregate({
        _sum: { paidAmount: true },
        where: { status: InvoiceStatus.PAID },
      }),
      prisma.invoice.aggregate({
        _sum: { totalAmount: true },
        where: { status: { in: [InvoiceStatus.SENT, InvoiceStatus.PARTIAL] } },
      }),
      getMonthlyFinanceSeries(),
      getMarketplaceAdminStats(),
      prisma.marketplacePayment.findMany({
        where: { status: MarketplacePaymentStatus.SUCCEEDED },
        orderBy: { updatedAt: "desc" },
        take: 5,
        include: {
          job: {
            select: {
              title: true,
              client: { select: { name: true, email: true } },
            },
          },
          quote: {
            select: { trader: { select: { name: true, email: true } } },
          },
        },
      }),
    ]);

    return {
      stats: {
        totalProjects: projectStatus.total,
        activeProjects: projectStatus.active,
        completedProjects: projectStatus.completed,
        planningProjects: projectStatus.planning,
        onHoldProjects: projectStatus.onHold,
        cancelledProjects: projectStatus.cancelled,
        totalClients,
        totalUsers,
        openIssues,
        totalRevenue: totalRevenue._sum.paidAmount ?? 0,
        pendingRevenue: pendingRevenue._sum.totalAmount ?? 0,
      },
      projectStatus,
      recentProjects,
      recentSiteReports,
      taskStats,
      monthly,
      market,
      recentPayments,
    };
  } catch (err) {
    console.error("[DASHBOARD]", err);
    return null;
  }
}

export default async function DashboardPage() {
  const session = await requireAuth();
  const data = await getDashboardData();

  if (!data) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
          <p className="font-semibold text-amber-800">Database not connected</p>
          <p className="mt-1 text-sm text-amber-600">
            Please add your MongoDB Atlas connection string to{" "}
            <code className="rounded bg-amber-100 px-1">.env.local</code>
          </p>
        </div>
      </div>
    );
  }

  const {
    stats,
    projectStatus,
    recentProjects,
    recentSiteReports,
    taskStats,
    monthly,
    market,
    recentPayments,
  } = data;

  const completedTasks =
    taskStats.find((t) => t.status === TaskStatus.COMPLETED)?._count ?? 0;
  const inProgressTasks =
    taskStats.find((t) => t.status === TaskStatus.IN_PROGRESS)?._count ?? 0;

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Good {getGreeting()}, {session.user.name?.split(" ")[0]}!
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Live data from projects, invoices, marketplace payments, and expenses.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard
          title="Total Projects"
          value={stats.totalProjects}
          icon={FolderKanban}
          color="blue"
          sub={`${stats.activeProjects} active`}
          href="/projects"
        />
        <StatsCard
          title="Invoice Revenue"
          value={formatMoney(Number(stats.totalRevenue))}
          icon={TrendingUp}
          color="green"
          sub={`${formatMoney(Number(stats.pendingRevenue))} pending`}
          href="/invoices"
        />
        <StatsCard
          title="Marketplace volume"
          value={formatMoney(market.paymentVolume)}
          icon={CreditCard}
          color="purple"
          sub={`${market.paymentsSucceeded} succeeded payments`}
          href="/transactions"
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

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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
          sub={`${stats.totalClients} clients`}
          href="/users"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard
          title="Open marketplace jobs"
          value={market.jobsOpen}
          icon={FolderKanban}
          color="blue"
          sub={`${market.jobsAwarded} awarded · ${market.jobsFunded} in work`}
          href="/projects"
        />
        <StatsCard
          title="Commission collected"
          value={formatMoney(market.commissionCollected)}
          icon={TrendingUp}
          color="green"
          sub="Platform fees"
          href="/transactions?tab=commissions"
        />
        <StatsCard
          title="Credit pack sales"
          value={formatMoney(market.creditSales)}
          icon={CreditCard}
          color="orange"
          sub={`${market.creditsSold} credits sold`}
          href="/transactions?tab=credits"
        />
        <StatsCard
          title="Connected traders"
          value={market.tradersConnected}
          icon={Building2}
          color="purple"
          sub="Stripe Connect onboarded"
          href="/contractors"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RevenueChart data={monthly} />
        </div>
        <div>
          <ProjectStatusChart
            total={projectStatus.total}
            active={projectStatus.active}
            completed={projectStatus.completed}
            planning={projectStatus.planning}
            onHold={projectStatus.onHold}
            cancelled={projectStatus.cancelled}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          <RecentProjects projects={recentProjects} />
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">
                Recent marketplace payments
              </h2>
              <Link
                href="/transactions"
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                View all →
              </Link>
            </div>
            {recentPayments.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">
                No succeeded marketplace payments yet
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {recentPayments.map((p) => (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{p.job.title}</p>
                      <p className="text-[11px] text-slate-500">
                        {(p.job.client.name ?? "").split(" — ")[0]} →{" "}
                        {(p.quote.trader.name ?? "").split(" — ")[0]}
                      </p>
                    </div>
                    <p className="font-bold text-[#0B2A4A]">
                      {formatMoney(p.customerTotal)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
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
