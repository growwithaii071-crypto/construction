import Link from "next/link";
import prisma from "@/lib/prisma";
import { requireAuth, ROLE_LABELS } from "@/lib/auth-utils";
import { UserRole } from "@/generated/prisma";
import { format } from "date-fns";
import {
  Users,
  ShieldCheck,
  HardHat,
  Building2,
  Settings,
  UserPlus,
  FolderKanban,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Activity,
  Globe,
  Database,
  Shield,
  Mail,
  Mails,
  Wrench,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin Panel" };

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "bg-rose-100 text-rose-700",
  ADMIN: "bg-red-100 text-red-700",
  PROJECT_MANAGER: "bg-blue-100 text-blue-700",
  SITE_ENGINEER: "bg-violet-100 text-violet-700",
  FOREMAN: "bg-orange-100 text-orange-700",
  ACCOUNTANT: "bg-emerald-100 text-emerald-700",
  CLIENT: "bg-cyan-100 text-cyan-700",
  CONTRACTOR: "bg-amber-100 text-amber-700",
  VIEWER: "bg-slate-100 text-slate-500",
};

const ROLE_ORDER = [
  "SUPER_ADMIN",
  "ADMIN",
  "PROJECT_MANAGER",
  "SITE_ENGINEER",
  "FOREMAN",
  "ACCOUNTANT",
  "CONTRACTOR",
  "CLIENT",
  "VIEWER",
] as const;

async function getAdminData() {
  try {
    const [
      allUsers,
      activeUsers,
      verifiedUsers,
      totalProjects,
      portalClients,
      portalContractors,
      openIssues,
      servicesCount,
      staffRolesCount,
      recentUsers,
      roleCounts,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { emailVerified: { not: null } } }),
      prisma.project.count(),
      prisma.user.count({ where: { role: UserRole.CLIENT } }),
      prisma.user.count({ where: { role: UserRole.CONTRACTOR } }),
      prisma.issue.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
      prisma.service.count().catch(() => 0),
      prisma.staffRole.count().catch(() => 0),
      prisma.user.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
          staffRole: { select: { name: true } },
        },
      }),
      prisma.user.groupBy({ by: ["role"], _count: true }),
    ]);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newUsersThisWeek = await prisma.user.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    });

    return {
      totals: {
        allUsers,
        activeUsers,
        verifiedUsers,
        newUsersThisWeek,
        totalProjects,
        portalClients,
        portalContractors,
        openIssues,
        servicesCount,
        staffRolesCount,
      },
      recentUsers,
      roleCounts,
    };
  } catch {
    return null;
  }
}

function userEditHref(role: string, id: string) {
  if (role === "CLIENT") return `/clients/${id}`;
  if (role === "CONTRACTOR") return `/contractors/${id}`;
  return `/users/${id}/edit`;
}

export default async function AdminPage() {
  const session = await requireAuth([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
  const data = await getAdminData();

  if (!data) {
    return (
      <div className="p-4 lg:p-6">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-14 text-center">
          <Database className="mx-auto h-8 w-8 text-amber-500" />
          <p className="mt-3 font-semibold text-amber-800">Database not connected</p>
          <p className="mt-1 text-sm text-amber-600">
            Configure MongoDB in <code className="rounded bg-amber-100 px-1">.env</code>
          </p>
        </div>
      </div>
    );
  }

  const { totals, recentUsers, roleCounts } = data;
  const roleMap = Object.fromEntries(roleCounts.map((r) => [r.role, r._count]));

  const quickLinks = [
    {
      href: "/users",
      icon: Users,
      label: "Users",
      desc: "Team members & staff",
      tone: "bg-blue-50 text-blue-600",
    },
    {
      href: "/roles",
      icon: Shield,
      label: "Roles",
      desc: "Modules & permissions",
      tone: "bg-violet-50 text-violet-600",
    },
    {
      href: "/clients",
      icon: Building2,
      label: "Clients",
      desc: "Portal customers",
      tone: "bg-cyan-50 text-cyan-600",
    },
    {
      href: "/contractors",
      icon: HardHat,
      label: "Contractors",
      desc: "Service providers",
      tone: "bg-amber-50 text-amber-600",
    },
    {
      href: "/admin/services",
      icon: Wrench,
      label: "Services",
      desc: "Contractor listings",
      tone: "bg-orange-50 text-orange-600",
    },
    {
      href: "/settings/email",
      icon: Mail,
      label: "SMTP",
      desc: "Outgoing mail server",
      tone: "bg-slate-100 text-slate-600",
    },
    {
      href: "/settings/email-templates",
      icon: Mails,
      label: "Templates",
      desc: "Email content",
      tone: "bg-slate-100 text-slate-600",
    },
    {
      href: "/settings",
      icon: Settings,
      label: "Settings",
      desc: "Account & system",
      tone: "bg-slate-100 text-slate-600",
    },
  ];

  return (
    <div className="space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-sm shadow-orange-500/25">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Signed in as{" "}
              <span className="font-semibold text-slate-700">{session.user.name}</span>
              {" · "}system overview
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/settings"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
          <Link
            href="/users/new"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-orange-500 px-4 text-sm font-semibold text-white shadow-sm shadow-orange-500/20 hover:bg-orange-600"
          >
            <UserPlus className="h-4 w-4" />
            Add user
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total users"
          value={totals.allUsers}
          sub={`${totals.activeUsers} active`}
          href="/users"
        />
        <StatCard
          icon={Building2}
          label="Clients"
          value={totals.portalClients}
          sub="portal customers"
          href="/clients"
        />
        <StatCard
          icon={HardHat}
          label="Contractors"
          value={totals.portalContractors}
          sub="service providers"
          href="/contractors"
        />
        <StatCard
          icon={TrendingUp}
          label="New this week"
          value={totals.newUsersThisWeek}
          sub="registrations"
        />
        <StatCard
          icon={FolderKanban}
          label="Projects"
          value={totals.totalProjects}
          sub="all time"
          href="/projects"
        />
        <StatCard
          icon={Wrench}
          label="Services"
          value={totals.servicesCount}
          sub="contractor listings"
          href="/admin/services"
        />
        <StatCard
          icon={Shield}
          label="Roles"
          value={totals.staffRolesCount}
          sub="permission sets"
          href="/roles"
        />
        <StatCard
          icon={AlertTriangle}
          label="Open issues"
          value={totals.openIssues}
          sub="need attention"
          href="/issues"
          alert={totals.openIssues > 5}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,1fr)]">
        {/* Role breakdown */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white">
              <Users className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Users by role</h2>
              <p className="text-xs text-slate-500">Distribution across the platform</p>
            </div>
          </div>

          <div className="space-y-3">
            {ROLE_ORDER.map((role) => {
              const count = roleMap[role] ?? 0;
              const pct = totals.allUsers > 0 ? (count / totals.allUsers) * 100 : 0;
              return (
                <div key={role} className="flex items-center gap-3">
                  <span
                    className={cn(
                      "w-[7.5rem] shrink-0 rounded-lg px-2 py-1 text-center text-[11px] font-semibold",
                      ROLE_COLORS[role]
                    )}
                  >
                    {ROLE_LABELS[role as UserRole] ?? role}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-orange-400 transition-all"
                      style={{ width: `${Math.max(pct, count > 0 ? 3 : 0)}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-sm font-semibold text-slate-700">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Quick links */}
        <section className="space-y-3">
          <h2 className="px-1 text-sm font-bold text-slate-900">Quick links</h2>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            {quickLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:border-orange-200 hover:shadow-md"
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                      item.tone
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 group-hover:text-orange-600">
                      {item.label}
                    </p>
                    <p className="truncate text-xs text-slate-400">{item.desc}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-orange-400" />
                </Link>
              );
            })}
          </div>
        </section>
      </div>

      {/* Recent users */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-bold text-slate-900">Recent registrations</h2>
          </div>
          <Link
            href="/users"
            className="text-xs font-semibold text-orange-600 hover:underline"
          >
            View team →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Joined</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm text-slate-400">
                    No users yet
                  </td>
                </tr>
              ) : (
                recentUsers.map((user) => (
                  <tr key={user.id} className="transition hover:bg-slate-50/80">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-bold text-white">
                          {user.name?.charAt(0)?.toUpperCase() ?? "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">{user.name}</p>
                          <p className="truncate text-xs text-slate-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={cn(
                          "inline-flex rounded-lg px-2 py-0.5 text-[11px] font-semibold",
                          ROLE_COLORS[user.role] ?? "bg-slate-100 text-slate-600"
                        )}
                      >
                        {user.staffRole?.name ?? ROLE_LABELS[user.role as UserRole] ?? user.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {user.isActive ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400">
                            <XCircle className="h-3.5 w-3.5" />
                            Inactive
                          </span>
                        )}
                        {!user.emailVerified && (
                          <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600">
                            Unverified
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-400">
                      {format(new Date(user.createdAt), "dd MMM yyyy")}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={userEditHref(user.role, user.id)}
                        className="text-xs font-semibold text-blue-600 hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Portals */}
      <div className="grid gap-3 sm:grid-cols-3">
        <PortalCard
          href="/"
          icon={Globe}
          title="Landing page"
          desc="Public marketing site"
          tone="blue"
        />
        <PortalCard
          href="/login"
          icon={Building2}
          title="Customer login"
          desc="Clients hire contractors"
          tone="cyan"
        />
        <PortalCard
          href="/login"
          icon={HardHat}
          title="Contractor login"
          desc="Companies offer services"
          tone="orange"
        />
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  href,
  alert,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  sub: string;
  href?: string;
  alert?: boolean;
}) {
  const inner = (
    <div
      className={cn(
        "rounded-2xl border bg-white p-4 shadow-sm transition",
        href && "hover:border-orange-200 hover:shadow-md",
        alert ? "border-red-200" : "border-slate-200"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
          <p className="mt-0.5 text-xs text-slate-400">{sub}</p>
        </div>
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl",
            alert ? "bg-red-50 text-red-500" : "bg-orange-50 text-orange-600"
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}

function PortalCard({
  href,
  icon: Icon,
  title,
  desc,
  tone,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  tone: "blue" | "cyan" | "orange";
}) {
  const tones = {
    blue: "border-blue-100 bg-blue-50/40 text-blue-600",
    cyan: "border-cyan-100 bg-cyan-50/40 text-cyan-600",
    orange: "border-orange-100 bg-orange-50/40 text-orange-600",
  };
  const link = {
    blue: "text-blue-600",
    cyan: "text-cyan-600",
    orange: "text-orange-600",
  };

  return (
    <div className={cn("rounded-2xl border p-5", tones[tone])}>
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/80">
          <Icon className="h-4 w-4" />
        </span>
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      </div>
      <p className="mb-3 text-xs text-slate-500">{desc}</p>
      <Link
        href={href}
        target="_blank"
        className={cn("text-xs font-semibold hover:underline", link[tone])}
      >
        Open →
      </Link>
    </div>
  );
}
