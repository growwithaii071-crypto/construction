"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface Props {
  total: number;
  active: number;
  completed: number;
  planning: number;
}

export function ProjectStatusChart({ total, active, completed, planning }: Props) {
  const onHold = Math.max(0, total - active - completed - planning);
  const data = [
    { name: "In Progress", value: active, color: "#3b82f6" },
    { name: "Completed", value: completed, color: "#22c55e" },
    { name: "Planning", value: planning, color: "#f97316" },
    { name: "On Hold", value: onHold, color: "#94a3b8" },
  ].filter((d) => d.value > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Project Status</CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="h-[260px] flex items-center justify-center text-gray-400 text-sm">
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
