import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";
import { format } from "date-fns";

interface Report {
  id: string;
  reportDate: Date;
  weather?: string | null;
  summary?: string | null;
  project: { name: string; code: string };
  reporter: { name: string | null };
}

export function RecentActivity({ reports }: { reports: Report[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base font-semibold">Site Activity</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/site-reports" className="text-blue-600 text-xs">
            View all <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {reports.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-8">No reports yet</p>
        ) : (
          <div className="space-y-4">
            {reports.map((r) => (
              <Link href={`/site-reports`} key={r.id}>
                <div className="flex gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{r.project.name}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {r.summary ?? "Daily site report"}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-gray-400">
                        {format(new Date(r.reportDate), "dd MMM yyyy")}
                      </span>
                      <span className="text-[10px] text-gray-300">·</span>
                      <span className="text-[10px] text-gray-400">{r.reporter.name}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
