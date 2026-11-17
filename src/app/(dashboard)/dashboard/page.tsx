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
import { RecentServiceJobs } from "@/components/dashboard/recent-service-jobs";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { ProjectStatusChart } from "@/components/dashboard/project-status-chart";
import { JobStatusChart } from "@/components/dashboard/job-status-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import {
  getMonthlyFinanceSeries,
  getProjectStatusCounts,
  getMarketplaceAdminStats,
  getServiceRequestStats,
  getPortalUserStats,
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
  HardHat,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

async function getDashboardData() {
  try {
    const [
      projectStatus,
      jobStats,
      portalUsers,
      openIssues,
      recentProjects,
      recentServiceJobs,
      recentSiteReports,
      taskStats,
      totalRevenue,
      pendingRevenue,
      monthly,
      market,
      recentPayments,
      clientRecords,
    ] = await Promise.all([
      getProjectStatusCounts(),
      getServiceRequestStats(),
      getPortalUserStats(),
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
      prisma.serviceRequest.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        include: {
          client: { select: { name: true, email: true } },
          service: {
            select: {
              title: true,
              category: true,
              contractor: { select: { name: true } },
            },
          },
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
      prisma.client.count(),
    ]);

    return {
      stats: {
        totalProjects: projectStatus.total,
        activeProjects: projectStatus.active,
        completedProjects: projectStatus.completed,
        openIssues,
        totalRevenue: totalRevenue._sum.paidAmount ?? 0,
        pendingRevenue: pendingRevenue._sum.totalAmount ?? 0,
        clientRecords,
      },
      projectStatus,
      jobStats,
      portalUsers,
      recentProjects,
      recentServiceJobs,
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
    jobStats,
    portalUsers,
    recentProjects,
    recentServiceJobs,
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

  const clientsShown = Math.max(portalUsers.clients, stats.clientRecords);

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Good {getGreeting()}, {session.user.name?.split(" ")[0]}!
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Live counts from service jobs, portal users, marketplace, invoices, and expenses.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard
          title="Service jobs"
          value={jobStats.total}
          icon={FolderKanban}
          color="blue"
          sub={`${jobStats.pending} pending · ${jobStats.inProgress} in progress`}
          href="/projects"
        />
        <StatsCard
          title="Active services"
          value={jobStats.services}
          icon={Wrench}
          color="orange"
          sub="Contractor listings"
          href="/admin/services"
        />
        <StatsCard
          title="Clients"
          value={clientsShown}
          icon={Building2}
          color="purple"
          sub="Portal customers"
          href="/clients"
        />
        <StatsCard
          title="Contractors"
          value={portalUsers.contractors}
          icon={HardHat}
          color="green"
          sub={`${market.tradersConnected} Connect ready`}
          href="/contractors"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard
          title="Invoice revenue"
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
          sub={`${market.paymentsSucceeded} payments · ${market.jobsTotal} jobs`}
          href="/transactions"
        />
        <StatsCard
          title="Commission collected"
          value={formatMoney(market.commissionCollected)}
          icon={TrendingUp}
          color="blue"
          sub="Platform fees"
          href="/transactions?tab=commissions"
        />
        <StatsCard
          title="Open issues"
          value={stats.openIssues}
          icon={AlertTriangle}
          color={stats.openIssues > 5 ? "red" : "orange"}
          sub="Need attention"
          href="/issues"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard
          title="Jobs completed"
          value={jobStats.completed}
          icon={CheckCircle2}
          color="green"
          sub={`${jobStats.accepted} accepted`}
          href="/projects?status=COMPLETED"
        />
        <StatsCard
          title="Tasks done"
          value={completedTasks}
          icon={CheckCircle2}
          color="blue"
          sub="Internal tasks"
        />
        <StatsCard
          title="Tasks in progress"
          value={inProgressTasks}
          icon={Clock}
          color="orange"
          sub="Internal tasks"
        />
        <StatsCard
          title="Team members"
          value={portalUsers.activeUsers}
          icon={Users}
          color="purple"
          sub={`${portalUsers.allUsers} total users`}
          href="/users"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RevenueChart data={monthly} />
        </div>
        <div>
          <JobStatusChart
            pending={jobStats.pending}
            accepted={jobStats.accepted}
            inProgress={jobStats.inProgress}
            completed={jobStats.completed}
            rejected={jobStats.rejected}
          />
        </div>
      </div>

      {projectStatus.total > 0 && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <RecentProjects projects={recentProjects} />
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
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          <RecentServiceJobs jobs={recentServiceJobs} />
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
