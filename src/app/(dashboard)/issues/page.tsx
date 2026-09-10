import Link from "next/link";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { AdminSearch } from "@/components/admin/admin-search";
import { CsvExportButton } from "@/components/admin/csv-export-button";
import type { Metadata } from "next";
import type { Prisma } from "@/generated/prisma";

export const metadata: Metadata = { title: "Issues" };

const SEVERITY_COLORS: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-600",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  HIGH: "bg-orange-100 text-orange-700",
  CRITICAL: "bg-red-100 text-red-700",
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-purple-100 text-purple-700",
  RESOLVED: "bg-green-100 text-green-700",
  CLOSED: "bg-gray-100 text-gray-500",
};

export default async function IssuesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAuth();
  const params = await searchParams;
  const q = (params.q ?? "").trim();

  const where: Prisma.IssueWhereInput = q
    ? {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { location: { contains: q, mode: "insensitive" } },
          { project: { name: { contains: q, mode: "insensitive" } } },
          { project: { code: { contains: q, mode: "insensitive" } } },
          { reporter: { name: { contains: q, mode: "insensitive" } } },
          { assignee: { name: { contains: q, mode: "insensitive" } } },
        ],
      }
    : {};

  const issues = await prisma.issue
    .findMany({
      where,
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
      include: {
        project: { select: { id: true, name: true, code: true } },
        reporter: { select: { name: true } },
        assignee: { select: { name: true } },
      },
    })
    .catch(() => []);

  const openCount = issues.filter((i) => i.status === "OPEN" || i.status === "IN_PROGRESS").length;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Issues</h1>
          <p className="text-sm text-gray-500">
            {openCount} open · {issues.length} total
          </p>
        </div>
        <Button asChild className="bg-orange-500 hover:bg-orange-600">
          <Link href="/issues/new">
            <Plus className="w-4 h-4 mr-2" /> Report Issue
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <AdminSearch
          basePath="/issues"
          initialQuery={q}
          placeholder="Search title, project, reporter…"
        />
        <CsvExportButton resource="issues" query={q} />
      </div>

      {issues.length === 0 ? (
        <div className="text-center py-20">
          <AlertTriangle className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">
            {q ? "No issues match your search" : "No issues reported"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {issues.map((issue) => (
            <Card key={issue.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                      issue.severity === "CRITICAL"
                        ? "bg-red-500"
                        : issue.severity === "HIGH"
                          ? "bg-orange-500"
                          : issue.severity === "MEDIUM"
                            ? "bg-yellow-500"
                            : "bg-gray-400"
                    )}
                  />
                  <div>
                    <p className="font-medium text-gray-900">{issue.title}</p>
                    {issue.description && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                        {issue.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5">
                      <Link
                        href={`/projects/${issue.project.id}`}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        {issue.project.code}
                      </Link>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-400">
                        Reported by {issue.reporter.name}
                      </span>
                      {issue.assignee && (
                        <>
                          <span className="text-xs text-gray-400">·</span>
                          <span className="text-xs text-gray-400">
                            Assigned: {issue.assignee.name}
                          </span>
                        </>
                      )}
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-400">
                        {format(new Date(issue.createdAt), "dd MMM")}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <span
                    className={cn(
                      "px-2 py-1 rounded-full text-[10px] font-semibold",
                      SEVERITY_COLORS[issue.severity]
                    )}
                  >
                    {issue.severity}
                  </span>
                  <span
                    className={cn(
                      "px-2 py-1 rounded-full text-[10px] font-semibold",
                      STATUS_COLORS[issue.status] ?? "bg-gray-100 text-gray-500"
                    )}
                  >
                    {issue.status.replace("_", " ")}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
