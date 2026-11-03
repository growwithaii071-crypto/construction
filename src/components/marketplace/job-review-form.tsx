"use client";

import { useState, useTransition } from "react";
import { Star, Loader2 } from "lucide-react";
import { submitJobReviewAction } from "@/actions/marketplace/reviews";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function JobReviewForm({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("jobId", jobId);
    fd.set("rating", String(rating));
    setErr(null);
    start(async () => {
      const res = await submitJobReviewAction(fd);
      if (!res.success) {
        setErr(res.message);
        return;
      }
      setMsg(res.message);
      router.refresh();
    });
  }

  if (msg) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
        {msg}
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-2xl border border-orange-100 bg-orange-50/40 p-5"
    >
      <div>
        <h3 className="font-bold text-[#0B2A4A]">Rate this trader</h3>
        <p className="text-xs text-slate-500">जॉब पूरा होने के बाद रिव्यू दें · Helps other customers</p>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(n)}
            className="p-0.5"
            aria-label={`${n} stars`}
          >
            <Star
              className={cn(
                "h-7 w-7",
                (hover || rating) >= n
                  ? "fill-amber-400 text-amber-400"
                  : "text-slate-300"
              )}
            />
          </button>
        ))}
      </div>
      <textarea
        name="comment"
        rows={3}
        placeholder="Optional comment…"
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
        disabled={pending}
      />
      {err && <p className="text-sm text-red-600">{err}</p>}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-10 items-center gap-2 rounded-xl bg-orange-500 px-4 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Submit review
      </button>
    </form>
  );
}
