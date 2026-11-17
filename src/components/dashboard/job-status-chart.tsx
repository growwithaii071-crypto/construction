"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface Props {
  pending: number;
  accepted: number;
  inProgress: number;
  completed: number;
  rejected?: number;
}

export function JobStatusChart({
  pending,
  accepted,
  inProgress,
  completed,
  rejected = 0,
}: Props) {
  const total = pending + accepted + inProgress + completed + rejected;
  const data = [
    { name: "Pending", value: pending, color: "#f59e0b" },
    { name: "Accepted", value: accepted, color: "#3b82f6" },
    { name: "In Progress", value: inProgress, color: "#8b5cf6" },
    { name: "Completed", value: completed, color: "#22c55e" },
    { name: "Rejected", value: rejected, color: "#ef4444" },
  ].filter((d) => d.value > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Service jobs by status</CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="flex h-[260px] items-center justify-center text-sm text-gray-400">
            No service requests yet
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
                formatter={(v) => [Number(v), "Jobs"]}
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
