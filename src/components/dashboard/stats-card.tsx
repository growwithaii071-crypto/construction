import Link from "next/link";
import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const colors = {
  blue: { bg: "bg-blue-50", icon: "bg-blue-100 text-blue-600", text: "text-blue-600" },
  green: { bg: "bg-green-50", icon: "bg-green-100 text-green-600", text: "text-green-600" },
  purple: { bg: "bg-purple-50", icon: "bg-purple-100 text-purple-600", text: "text-purple-600" },
  orange: { bg: "bg-orange-50", icon: "bg-orange-100 text-orange-600", text: "text-orange-600" },
  red: { bg: "bg-red-50", icon: "bg-red-100 text-red-600", text: "text-red-600" },
};

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: keyof typeof colors;
  sub?: string;
  href?: string;
}

export function StatsCard({ title, value, icon: Icon, color, sub, href }: StatsCardProps) {
  const c = colors[color];
  const content = (
    <Card className={cn("p-5 hover:shadow-md transition-shadow", href && "cursor-pointer")}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {sub && <p className={cn("text-xs mt-1.5 font-medium", c.text)}>{sub}</p>}
        </div>
        <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center", c.icon)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </Card>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return content;
}
