"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface Props {
  total: number;
  active: number;
  completed: number;
  planning: number;
  onHold?: number;
  cancelled?: number;
}

export function ProjectStatusChart({
  total,
  active,
  completed,
  planning,
  onHold = 0,
  cancelled = 0,
}: Props) {
  const data = [
    { name: "In Progress", value: active, color: "#3b82f6" },
    { name: "Completed", value: completed, color: "#22c55e" },
    { name: "Planning", value: planning, color: "#f97316" },
    { name: "On Hold", value: onHold, color: "#94a3b8" },
    { name: "Cancelled", value: cancelled, color: "#ef4444" },
  ].filter((d) => d.value > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Project Status</CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="flex h-[260px] items-center justify-center text-sm text-gray-400">
            No projects yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={data} cx="50%" cy="45%" outerRadius={85} dataKey="value" strokeWidth={2}>
                {data.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => [Number(v), "Projects"]}
                contentStyle={{ borderRadius: 8, fontSize: 12 }}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
