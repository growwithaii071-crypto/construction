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

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Static placeholder data — will be replaced with real DB data
const data = MONTHS.map((m, i) => ({
  month: m,
  revenue: Math.floor(300000 + Math.random() * 700000 * Math.sin((i + 1) * 0.5 + 1)),
  expenses: Math.floor(150000 + Math.random() * 300000),
}));

export function RevenueChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Revenue vs Expenses (2026)</CardTitle>
      </CardHeader>
      <CardContent>
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
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v / 1000}K`} />
            <Tooltip
              formatter={(v) => [`₹${(Number(v) / 100000).toFixed(1)}L`, ""]}
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
      </CardContent>
    </Card>
  );
}
