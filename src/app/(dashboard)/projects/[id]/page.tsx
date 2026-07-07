import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit, Building2, User, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { TaskBoard } from "@/components/tasks/task-board";
import { deleteProjectAction } from "@/actions/projects";
import type { Metadata } from "next";

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  PLANNING: { label: "Planning", class: "bg-orange-100 text-orange-700" },
  IN_PROGRESS: { label: "In Progress", class: "bg-blue-100 text-blue-700" },
  ON_HOLD: { label: "On Hold", class: "bg-yellow-100 text-yellow-700" },
  COMPLETED: { label: "Completed", class: "bg-green-100 text-green-700" },
  CANCELLED: { label: "Cancelled", class: "bg-red-100 text-red-700" },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const p = await prisma.project
    .findUnique({ where: { id }, select: { name: true } })
    .catch(() => null);
  return { title: p?.name ?? "Project" };
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const { id } = await params;

  const project = await prisma.project
    .findUnique({
      where: { id },
      include: {
        client: true,
        manager: { select: { id: true, name: true, email: true } },
        tasks: {
          orderBy: { createdAt: "desc" },
          include: { assignee: { select: { name: true } } },
        },
        milestones: { orderBy: { dueDate: "asc" } },
        invoices: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            invoiceNo: true,
            invoiceNumber: true,
            totalAmount: true,
            status: true,
            dueDate: true,
          },
        },
        issues: {
          orderBy: { createdAt: "desc" },
          select: { id: true, title: true, severity: true, status: true },
        },
        siteReports: {
          orderBy: { reportDate: "desc" },
          take: 5,
          include: { reporter: { select: { name: true } } },
        },
      },
    })
    .catch(() => null);

  if (!project) notFound();

  const sc = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.PLANNING;

  const totalBudget = project.budgetAmount ?? 0;
  const totalCost = project.spentAmount ?? 0;
  const budgetUsed = totalBudget > 0 ? Math.round((totalCost / totalBudget) * 100) : 0;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/projects">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#0f2137] rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">{project.code.slice(0, 2)}</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
                <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold", sc.class)}>
                  {sc.label}
                </span>
              </div>
              <p className="text-sm text-gray-400">
                {project.code}
                {project.type ? ` · ${project.type}` : ""}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" asChild>
            <Link href={`/projects/${id}/edit`}>
              <Edit className="w-4 h-4 mr-2" /> Edit
            </Link>
          </Button>
          <form
            action={async () => {
              "use server";
              await deleteProjectAction(id);
            }}
          >
            <Button
              variant="outline"
              type="submit"
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-gray-500">Progress</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{project.progress}%</p>
          <Progress value={project.progress} className="mt-2 h-2" />
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500">Budget Used</p>
          <p
            className={cn(
              "text-2xl font-bold mt-1",
              budgetUsed > 90 ? "text-red-600" : "text-gray-900"
            )}
          >
            {budgetUsed}%
          </p>
          <p className="text-xs text-gray-400 mt-1">
            ₹{(totalCost / 100000).toFixed(1)}L / ₹{(totalBudget / 100000).toFixed(1)}L
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500">Tasks</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{project.tasks.length}</p>
          <p className="text-xs text-gray-400 mt-1">
            {project.tasks.filter((t) => t.status === "COMPLETED").length} completed
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500">Open Issues</p>
          <p
            className={cn(
              "text-2xl font-bold mt-1",
              project.issues.filter((i) => i.status === "OPEN").length > 0
                ? "text-orange-600"
                : "text-gray-900"
            )}
          >
            {project.issues.filter((i) => i.status === "OPEN").length}
          </p>
          <p className="text-xs text-gray-400 mt-1">{project.issues.length} total</p>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="bg-gray-100">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks ({project.tasks.length})</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="finance">Finance</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {project.description && (
                <Card className="p-5">
                  <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{project.description}</p>
                </Card>
              )}
              <Card className="p-5">
                <h3 className="font-semibold text-gray-900 mb-3">Project Info</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {project.startDate && (
                    <div>
                      <p className="text-gray-400 text-xs">Start Date</p>
                      <p className="font-medium mt-0.5">
                        {format(new Date(project.startDate), "dd MMM yyyy")}
                      </p>
                    </div>
                  )}
                  {project.endDate && (
                    <div>
                      <p className="text-gray-400 text-xs">End Date</p>
                      <p className="font-medium mt-0.5">
                        {format(new Date(project.endDate), "dd MMM yyyy")}
                      </p>
                    </div>
                  )}
                  {project.budgetAmount > 0 && (
                    <div>
                      <p className="text-gray-400 text-xs">Budget</p>
                      <p className="font-medium mt-0.5">
                        ₹{project.budgetAmount.toLocaleString("en-IN")}
                      </p>
                    </div>
                  )}
                  {project.contractValue && (
                    <div>
                      <p className="text-gray-400 text-xs">Contract Value</p>
                      <p className="font-medium mt-0.5">
                        ₹{Number(project.contractValue).toLocaleString("en-IN")}
                      </p>
                    </div>
                  )}
                  {project.city && (
                    <div className="col-span-2">
                      <p className="text-gray-400 text-xs">Location</p>
                      <p className="font-medium mt-0.5">
                        {[project.location, project.city, project.state].filter(Boolean).join(", ")}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            <div className="space-y-4">
              {/* Client */}
              <Card className="p-5">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-400" /> Client
                </h3>
                <Link href={`/clients/${project.client.id}`} className="group">
                  <p className="text-sm font-medium text-blue-600 group-hover:underline">
                    {project.client.name}
                  </p>
                  {project.client.email && (
                    <p className="text-xs text-gray-400 mt-0.5">{project.client.email}</p>
                  )}
                  {project.client.phone && (
                    <p className="text-xs text-gray-400">{project.client.phone}</p>
                  )}
                </Link>
              </Card>
              {/* Manager */}
              {project.manager && (
                <Card className="p-5">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" /> Project Manager
                  </h3>
                  <p className="text-sm font-medium">{project.manager.name}</p>
                  <p className="text-xs text-gray-400">{project.manager.email}</p>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="mt-4">
          <TaskBoard projectId={id} tasks={project.tasks} />
        </TabsContent>

        {/* Milestones */}
        <TabsContent value="milestones" className="mt-4">
          <Card className="p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">Milestones</h3>
              <Button size="sm" variant="outline" asChild>
                <Link href={`/projects/${id}/milestones`}>Manage</Link>
              </Button>
            </div>
            {project.milestones.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No milestones added</p>
            ) : (
              <div className="space-y-3">
                {project.milestones.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium">{m.title ?? m.name}</p>
                      {m.dueDate && (
                        <p className="text-xs text-gray-400">
                          {format(new Date(m.dueDate), "dd MMM yyyy")}
                        </p>
                      )}
                    </div>
                    <Badge variant={m.completed ? "default" : "outline"}>
                      {m.completed ? "Done" : m.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Finance */}
        <TabsContent value="finance" className="mt-4">
          <Card className="p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Invoices</h3>
              <Button size="sm" asChild>
                <Link href={`/invoices/new?projectId=${id}`}>+ Invoice</Link>
              </Button>
            </div>
            {project.invoices.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No invoices yet</p>
            ) : (
              <div className="space-y-2">
                {project.invoices.map((inv) => (
                  <Link href={`/invoices/${inv.id}`} key={inv.id}>
                    <div className="flex items-center justify-between py-3 border-b last:border-0 hover:bg-gray-50 px-2 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{inv.invoiceNumber ?? inv.invoiceNo}</p>
                        {inv.dueDate && (
                          <p className="text-xs text-gray-400">
                            Due {format(new Date(inv.dueDate), "dd MMM yyyy")}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          ₹{Number(inv.totalAmount).toLocaleString("en-IN")}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {inv.status}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Issues */}
        <TabsContent value="issues" className="mt-4">
          <Card className="p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Issues</h3>
              <Button size="sm" asChild>
                <Link href={`/issues?projectId=${id}`}>+ Issue</Link>
              </Button>
            </div>
            {project.issues.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No issues reported</p>
            ) : (
              <div className="space-y-2">
                {project.issues.map((iss) => (
                  <div
                    key={iss.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <p className="text-sm">{iss.title}</p>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">
                        {iss.severity}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {iss.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Reports */}
        <TabsContent value="reports" className="mt-4">
          <Card className="p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Site Reports</h3>
              <Button size="sm" asChild>
                <Link href={`/site-reports/new?projectId=${id}`}>+ Report</Link>
              </Button>
            </div>
            {project.siteReports.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No reports submitted</p>
            ) : (
              <div className="space-y-3">
                {project.siteReports.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-start justify-between py-2 border-b last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {format(new Date(r.reportDate), "dd MMM yyyy")}
                      </p>
                      {r.summary && (
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{r.summary}</p>
                      )}
                      <p className="text-xs text-gray-300 mt-0.5">by {r.reporter.name}</p>
                    </div>
                    {r.weather && (
                      <Badge variant="outline" className="text-xs">
                        {r.weather}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
