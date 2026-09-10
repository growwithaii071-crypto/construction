"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminSearch({
  basePath,
  initialQuery = "",
  placeholder = "Search…",
  className,
  /** Extra query params to keep (e.g. status) — page is always reset */
  preserve,
}: {
  basePath: string;
  initialQuery?: string;
  placeholder?: string;
  className?: string;
  preserve?: Record<string, string | undefined | null>;
}) {
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setQ(initialQuery);
  }, [initialQuery]);

  function buildUrl(nextQ: string) {
    const params = new URLSearchParams();
    if (preserve) {
      for (const [key, value] of Object.entries(preserve)) {
        if (value) params.set(key, value);
      }
    }
    if (nextQ.trim()) params.set("q", nextQ.trim());
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  useEffect(() => {
    const trimmed = q.trim();
    const initial = initialQuery.trim();
    if (trimmed === initial) return;

    const t = setTimeout(() => {
      startTransition(() => {
        router.push(buildUrl(trimmed));
      });
    }, 350);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, initialQuery, basePath, router]);

  function clear() {
    setQ("");
    startTransition(() => router.push(buildUrl("")));
  }

  return (
    <div className={cn("relative w-full max-w-md", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white pr-10 pl-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-300 focus:ring-2 focus:ring-orange-500/20"
      />
      <div className="absolute top-1/2 right-3 -translate-y-1/2">
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
        ) : q ? (
          <button
            type="button"
            onClick={clear}
            className="rounded-md p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
