"use client";

import { Download } from "lucide-react";
import { cn } from "@/lib/utils";

export function CsvExportButton({
  resource,
  query,
  status,
  className,
  label = "Export CSV",
}: {
  resource: string;
  query?: string;
  status?: string;
  className?: string;
  label?: string;
}) {
  const params = new URLSearchParams();
  params.set("resource", resource);
  if (query?.trim()) params.set("q", query.trim());
  if (status && status !== "ALL") params.set("status", status);

  return (
    <a
      href={`/api/admin/export?${params.toString()}`}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700",
        className
      )}
    >
      <Download className="h-4 w-4" />
      {label}
    </a>
  );
}
