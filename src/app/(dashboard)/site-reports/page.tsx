import Link from "next/link";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, ClipboardList, Calendar, User, Cloud } from "lucide-react";
import { format } from "date-fns";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Site Reports" };

export default async function SiteReportsPage() {
  await requireAuth();

  const reports = await prisma.siteReport
    .findMany({
      orderBy: { reportDate: "desc" },
      include: {
        project: { select: { id: true, name: true, code: true } },
        reporter: { select: { name: true } },
      },
    })
    .catch(() => []);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Site Reports</h1>
          <p className="text-sm text-gray-500">{reports.length} reports</p>
        </div>
        <Button asChild className="bg-orange-500 hover:bg-orange-600">
          <Link href="/site-reports/new">
            <Plus className="w-4 h-4 mr-2" /> New Report
          </Link>
        </Button>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-20">
          <ClipboardList className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No reports yet</p>
          <Button className="mt-6 bg-orange-500 hover:bg-orange-600" asChild>
            <Link href="/site-reports/new">
              <Plus className="w-4 h-4 mr-2" /> Submit Report
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <ClipboardList className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <Link
                      href={`/projects/${report.project.id}`}
                      className="font-semibold text-gray-900 hover:text-blue-600"
                    >
                      {report.project.name}
                    </Link>
                    <p className="text-xs text-gray-400">{report.project.code}</p>
                    {report.summary && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{report.summary}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(report.reportDate), "dd MMM yyyy")}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <User className="w-3 h-3" />
                        {report.reporter.name}
                      </span>
                      {report.weather && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Cloud className="w-3 h-3" />
                          {report.weather}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <Badge variant="outline" className="text-xs">
                    {report.workProgress ?? 0}%
                  </Badge>
                  {report.totalWorkers !== undefined && report.totalWorkers !== null && (
                    <p className="text-xs text-gray-400">{report.totalWorkers} workers</p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
