import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  ACCEPTED: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-violet-100 text-violet-700",
  COMPLETED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

type Job = {
  id: string;
  status: string;
  location: string | null;
  createdAt: Date;
  client: { name: string | null; email: string };
  service: {
    title: string;
    category: string;
    contractor: { name: string | null };
  };
};

export function RecentServiceJobs({ jobs }: { jobs: Job[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base font-semibold">Recent service jobs</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/projects" className="text-xs text-blue-600">
            View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {jobs.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">No service requests yet</p>
        ) : (
          <div className="space-y-3">
            {jobs.map((j) => (
              <Link href="/projects" key={j.id}>
                <div className="flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-gray-50">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0f2137] text-xs font-bold text-white">
                    {(j.service.title || "JR").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {j.service.title}
                      </p>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-medium",
                          STATUS_STYLES[j.status] ?? "bg-slate-100 text-slate-600"
                        )}
                      >
                        {j.status.replaceAll("_", " ")}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-gray-500">
                      {(j.client.name ?? j.client.email).split(" — ")[0]} ·{" "}
                      {(j.service.contractor.name ?? "Trader").split(" — ")[0]}
                      {j.location ? ` · ${j.location}` : ""}
                    </p>
                    <p className="mt-1 text-[10px] text-gray-400">
                      {j.service.category} · {format(new Date(j.createdAt), "dd MMM yyyy")}
                    </p>
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
