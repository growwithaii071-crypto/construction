import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowRight } from "lucide-react";
import { ProjectStatus } from "@/generated/prisma";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, { label: string; class: string }> = {
  [ProjectStatus.PLANNING]: { label: "Planning", class: "bg-orange-100 text-orange-700" },
  [ProjectStatus.IN_PROGRESS]: { label: "In Progress", class: "bg-blue-100 text-blue-700" },
  [ProjectStatus.ON_HOLD]: { label: "On Hold", class: "bg-yellow-100 text-yellow-700" },
  [ProjectStatus.COMPLETED]: { label: "Completed", class: "bg-green-100 text-green-700" },
  [ProjectStatus.CANCELLED]: { label: "Cancelled", class: "bg-red-100 text-red-700" },
};

interface Project {
  id: string;
  name: string;
  code: string;
  status: ProjectStatus;
  progress: number;
  client?: { name: string } | null;
  manager?: { name: string | null } | null;
  endDate?: Date | null;
}

export function RecentProjects({ projects }: { projects: Project[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base font-semibold">Recent Projects</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/projects" className="text-blue-600 text-xs">
            View all <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-8">No projects yet</p>
        ) : (
          <div className="space-y-4">
            {projects.map((p) => {
              const s = STATUS_STYLES[p.status] ?? STATUS_STYLES[ProjectStatus.PLANNING];
              return (
                <Link href={`/projects/${p.id}`} key={p.id}>
                  <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                    <div className="w-10 h-10 bg-[#0f2137] rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">{p.code.slice(0, 2)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0",
                            s.class
                          )}
                        >
                          {s.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {p.client?.name} {p.manager?.name ? `· PM: ${p.manager.name}` : ""}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Progress value={p.progress} className="flex-1 h-1.5" />
                        <span className="text-xs text-gray-500 flex-shrink-0">{p.progress}%</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
