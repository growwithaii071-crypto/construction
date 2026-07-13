import Link from "next/link";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { UserRole } from "@/generated/prisma";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin Panel — BuildPro" };

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "bg-rose-100 text-rose-700 border-rose-200",
  ADMIN: "bg-red-100 text-red-700 border-red-200",
  PROJECT_MANAGER: "bg-blue-100 text-blue-700 border-blue-200",
  SITE_ENGINEER: "bg-purple-100 text-purple-700 border-purple-200",
  FOREMAN: "bg-orange-100 text-orange-700 border-orange-200",
  ACCOUNTANT: "bg-green-100 text-green-700 border-green-200",
  CLIENT: "bg-cyan-100 text-cyan-700 border-cyan-200",
  CONTRACTOR: "bg-amber-100 text-amber-700 border-amber-200",
  VIEWER: "bg-gray-100 text-gray-500 border-gray-200",
};

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  PROJECT_MANAGER: "Project Manager",
  SITE_ENGINEER: "Site Engineer",
  FOREMAN: "Foreman",
  ACCOUNTANT: "Accountant",
  CLIENT: "Client",
  CONTRACTOR: "Contractor",
  VIEWER: "Viewer",
};

async function getAdminData() {
  try {
    const [
      allUsers,
      totalProjects,
      totalClients,
      totalContractors,
      openIssues,
      recentUsers,
      roleCounts,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.client.count(),
      prisma.contractor.count(),
      prisma.issue.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
      prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
        },
      }),
      prisma.user.groupBy({ by: ["role"], _count: true }),
    ]);

    const activeUsers = await prisma.user.count({ where: { isActive: true } });
    const verifiedUsers = await prisma.user.count({ where: { emailVerified: { not: null } } });

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
        totalClients,
        totalContractors,
        openIssues,
      },
      recentUsers,
      roleCounts,
    };
  } catch {
    return null;
  }
}

export default async function AdminPage() {
  const session = await requireAuth([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
  const data = await getAdminData();

  if (!data) {
    return (
      <div className="p-6">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <Database className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <p className="font-semibold text-amber-800">Database not connected</p>
          <p className="text-sm text-amber-600 mt-1">
            Please configure your MongoDB connection string in{" "}
            <code className="bg-amber-100 px-1 rounded">.env.local</code>
          </p>
        </div>
      </div>
    );
  }

  const { totals, recentUsers, roleCounts } = data;

  const roleMap = Object.fromEntries(roleCounts.map((r) => [r.role, r._count]));

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          </div>
          <p className="text-sm text-gray-500">
            Signed in as <span className="font-semibold text-gray-700">{session.user.name}</span> ·
            Full system access
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="h-9 text-sm">
            <Link href="/settings">
              <Settings className="w-4 h-4 mr-1.5" /> Settings
            </Link>
          </Button>
          <Button asChild className="h-9 text-sm bg-orange-500 hover:bg-orange-600">
            <Link href="/users/new">
              <UserPlus className="w-4 h-4 mr-1.5" /> Add User
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Users"
          value={totals.allUsers}
          sub={`${totals.activeUsers} active`}
          color="blue"
          href="/users"
        />
        <StatCard
          icon={CheckCircle2}
          label="Verified Accounts"
          value={totals.verifiedUsers}
          sub={`${totals.allUsers - totals.verifiedUsers} pending`}
          color="green"
        />
        <StatCard
          icon={TrendingUp}
          label="New This Week"
          value={totals.newUsersThisWeek}
          sub="new registrations"
          color="orange"
        />
        <StatCard
          icon={AlertTriangle}
          label="Open Issues"
          value={totals.openIssues}
          sub="need attention"
          color={totals.openIssues > 5 ? "red" : "gray"}
          href="/issues"
        />
      </div>

      {/* Stats Row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={FolderKanban}
          label="Total Projects"
          value={totals.totalProjects}
          sub="all time"
          color="purple"
          href="/projects"
        />
        <StatCard
          icon={Building2}
          label="Clients"
          value={totals.totalClients}
          sub="registered clients"
          color="cyan"
          href="/clients"
        />
        <StatCard
          icon={HardHat}
          label="Contractors"
          value={totals.totalContractors}
          sub="registered contractors"
          color="amber"
          href="/contractors"
        />
        <StatCard
          icon={Activity}
          label="Active Users"
          value={totals.activeUsers}
          sub={`${Math.round((totals.activeUsers / Math.max(totals.allUsers, 1)) * 100)}% of total`}
          color="green"
        />
      </div>

      {/* Role Breakdown + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Role Breakdown */}
        <div className="lg:col-span-2">
          <Card className="p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Lock className="w-4 h-4 text-gray-400" />
              Users by Role
            </h2>
            <div className="space-y-2.5">
              {(
                [
                  "SUPER_ADMIN",
                  "ADMIN",
                  "PROJECT_MANAGER",
                  "SITE_ENGINEER",
                  "FOREMAN",
                  "ACCOUNTANT",
                  "CONTRACTOR",
                  "CLIENT",
                  "VIEWER",
                ] as const
              ).map((role) => {
                const count = roleMap[role] ?? 0;
                const pct = totals.allUsers > 0 ? (count / totals.allUsers) * 100 : 0;
                return (
                  <div key={role} className="flex items-center gap-3">
                    <span
                      className={cn(
                        "text-xs font-semibold px-2 py-0.5 rounded border w-28 text-center shrink-0",
                        ROLE_COLORS[role]
                      )}
                    >
                      {ROLE_LABELS[role]}
                    </span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-orange-400 rounded-full transition-all"
                        style={{ width: `${Math.max(pct, count > 0 ? 2 : 0)}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 w-6 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-gray-900 px-1">Quick Actions</h2>

          {[
            {
              href: "/users",
              icon: Users,
              label: "Manage Users",
              desc: "View, edit & deactivate accounts",
              color: "blue",
            },
            {
              href: "/users/new",
              icon: UserPlus,
              label: "Add New User",
              desc: "Create a team member account",
              color: "green",
            },
            {
              href: "/projects",
              icon: FolderKanban,
              label: "All Projects",
              desc: "View and manage all projects",
              color: "purple",
            },
            {
              href: "/clients",
              icon: Building2,
              label: "Client Management",
              desc: "View all registered clients",
              color: "cyan",
            },
            {
              href: "/contractors",
              icon: HardHat,
              label: "Contractors",
              desc: "Manage construction teams",
              color: "amber",
            },
            {
              href: "/settings",
              icon: Settings,
              label: "System Settings",
              desc: "Configure platform options",
              color: "gray",
            },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href}>
                <Card className="p-3.5 hover:shadow-md transition-shadow cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                        action.color === "blue" && "bg-blue-50 text-blue-500",
                        action.color === "green" && "bg-green-50 text-green-500",
                        action.color === "purple" && "bg-purple-50 text-purple-500",
                        action.color === "cyan" && "bg-cyan-50 text-cyan-500",
                        action.color === "amber" && "bg-amber-50 text-amber-500",
                        action.color === "gray" && "bg-gray-50 text-gray-500"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 group-hover:text-orange-600 transition-colors">
                        {action.label}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{action.desc}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Registrations */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-gray-400" />
            Recent User Registrations
          </h2>
          <Link href="/users" className="text-xs text-orange-600 hover:text-orange-700 font-semibold">
            View all →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-400 pb-3 pr-4">User</th>
                <th className="text-left text-xs font-semibold text-gray-400 pb-3 pr-4">Role</th>
                <th className="text-left text-xs font-semibold text-gray-400 pb-3 pr-4">Status</th>
                <th className="text-left text-xs font-semibold text-gray-400 pb-3">Joined</th>
                <th className="text-right text-xs font-semibold text-gray-400 pb-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400 text-sm">
                    No users yet
                  </td>
                </tr>
              ) : (
                recentUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="w-8 h-8 shrink-0">
                          <AvatarFallback className="bg-slate-800 text-white text-xs font-bold">
                            {user.name?.charAt(0) ?? "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate text-sm">
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={cn(
                          "text-xs font-semibold px-2 py-0.5 rounded border",
                          ROLE_COLORS[user.role] ?? "bg-gray-100"
                        )}
                      >
                        {ROLE_LABELS[user.role] ?? user.role}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-1.5">
                        {user.isActive ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-gray-300" />
                        )}
                        <span className={cn("text-xs", user.isActive ? "text-green-600" : "text-gray-400")}>
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                        {!user.emailVerified && (
                          <Badge className="text-[10px] px-1.5 py-0 bg-amber-50 text-amber-600 border-amber-200 ml-1">
                            Unverified
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3 text-xs text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/users/${user.id}/edit`}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Portal Access Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 border-blue-100 bg-blue-50/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
              <Globe className="w-4 h-4 text-blue-500" />
            </div>
            <h3 className="font-semibold text-gray-800 text-sm">Landing Page</h3>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Public marketing page visible to all visitors.
          </p>
          <Link
            href="/"
            target="_blank"
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
          >
            Visit → localhost:3000
          </Link>
        </Card>

        <Card className="p-5 border-cyan-100 bg-cyan-50/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-cyan-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-cyan-500" />
            </div>
            <h3 className="font-semibold text-gray-800 text-sm">Customer Portal</h3>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Sign up / Sign in for customers hiring contractors.
          </p>
          <Link
            href="/customer/login"
            target="_blank"
            className="text-xs text-cyan-600 hover:text-cyan-700 font-semibold"
          >
            Visit → /customer/login
          </Link>
        </Card>

        <Card className="p-5 border-orange-100 bg-orange-50/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center">
              <HardHat className="w-4 h-4 text-orange-500" />
            </div>
            <h3 className="font-semibold text-gray-800 text-sm">Contractor Portal</h3>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Sign up / Sign in for construction companies.
          </p>
          <Link
            href="/construction/login"
            target="_blank"
            className="text-xs text-orange-600 hover:text-orange-700 font-semibold"
          >
            Visit → /construction/login
          </Link>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  sub: string;
  color: string;
  href?: string;
}) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-500",
    green: "bg-green-50 text-green-500",
    orange: "bg-orange-50 text-orange-500",
    red: "bg-red-50 text-red-500",
    purple: "bg-purple-50 text-purple-500",
    cyan: "bg-cyan-50 text-cyan-500",
    amber: "bg-amber-50 text-amber-500",
    gray: "bg-gray-50 text-gray-400",
  };

  const inner = (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
        </div>
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", colorMap[color] ?? colorMap.gray)}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </Card>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}
