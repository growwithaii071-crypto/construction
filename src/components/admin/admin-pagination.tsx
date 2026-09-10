import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminPagination({
  page,
  totalPages,
  basePath,
  query,
}: {
  page: number;
  totalPages: number;
  basePath: string;
  /** Extra search query to preserve across pages */
  query?: string;
}) {
  if (totalPages <= 1) return null;

  const prev = page > 1 ? page - 1 : null;
  const next = page < totalPages ? page + 1 : null;

  function href(p: number) {
    const params = new URLSearchParams();
    params.set("page", String(p));
    if (query?.trim()) params.set("q", query.trim());
    return `${basePath}?${params.toString()}`;
  }

  const windowSize = 5;
  let start = Math.max(1, page - Math.floor(windowSize / 2));
  const end = Math.min(totalPages, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row">
      <p className="text-xs text-slate-500">
        Page <span className="font-semibold text-slate-800">{page}</span> of{" "}
        <span className="font-semibold text-slate-800">{totalPages}</span>
      </p>
      <div className="flex items-center gap-1">
        {prev ? (
          <Link
            href={href(prev)}
            className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </Link>
        ) : (
          <span className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-100 px-3 text-xs font-semibold text-slate-300">
            <ChevronLeft className="h-4 w-4" />
            Prev
          </span>
        )}

        {pages.map((p) => (
          <Link
            key={p}
            href={href(p)}
            className={cn(
              "inline-flex h-9 min-w-9 items-center justify-center rounded-xl text-xs font-semibold",
              p === page
                ? "bg-orange-500 text-white"
                : "border border-slate-200 text-slate-700 hover:bg-slate-50"
            )}
          >
            {p}
          </Link>
        ))}

        {next ? (
          <Link
            href={href(next)}
            className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <span className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-100 px-3 text-xs font-semibold text-slate-300">
            Next
            <ChevronRight className="h-4 w-4" />
          </span>
        )}
      </div>
    </div>
  );
}
