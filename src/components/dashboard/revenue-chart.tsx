"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export type RevenuePoint = {
  month: string;
  revenue: number;
  expenses: number;
  marketplace?: number;
};

export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  const hasAny = data.some((d) => d.revenue > 0 || d.expenses > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          Revenue vs Expenses (last 12 months)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasAny ? (
          <div className="flex h-[260px] items-center justify-center text-sm text-gray-400">
            No invoice, marketplace, or expense data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) =>
                  Number(v) >= 1000 ? `£${(Number(v) / 1000).toFixed(0)}k` : `£${v}`
                }
              />
              <Tooltip
                formatter={(v, name) => [
                  `£${Number(v).toLocaleString("en-GB", { maximumFractionDigits: 2 })}`,
                  String(name),
                ]}
                contentStyle={{ borderRadius: 8, fontSize: 12 }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                fill="url(#revenue)"
                strokeWidth={2}
                name="Revenue"
              />
              <Area
                type="monotone"
                dataKey="expenses"
                stroke="#f97316"
                fill="url(#expenses)"
                strokeWidth={2}
                name="Expenses"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
