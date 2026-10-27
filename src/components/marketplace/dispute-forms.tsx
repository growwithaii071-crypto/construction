"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertTriangle, Shield } from "lucide-react";
import { raiseDisputeAction, reportProblemAction } from "@/actions/marketplace/disputes";

export function RaiseDisputeForm({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("jobId", jobId);
    startTransition(async () => {
      const res = await raiseDisputeAction(fd);
      if (!res.success) {
        setError(res.message);
        return;
      }
      setOk(res.message);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 text-sm font-semibold text-amber-900 hover:bg-amber-100"
      >
        <Shield className="h-4 w-4" />
        Raise dispute
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
      <p className="text-sm font-bold text-amber-950">Protected dispute</p>
      <p className="text-xs text-amber-800/80">
        Funds stay held until admin decides: full release, partial release, or refund.
      </p>
      <textarea
        name="reason"
        required
        minLength={10}
        rows={4}
        placeholder="Describe what went wrong…"
        className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm"
        disabled={pending || !!ok}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {ok && <p className="text-sm text-emerald-700">{ok}</p>}
      {!ok && (
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-amber-600 px-4 text-sm font-bold text-white hover:bg-amber-700 disabled:opacity-60"
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Submit dispute
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="h-10 rounded-xl px-3 text-sm font-semibold text-slate-600"
          >
            Cancel
          </button>
        </div>
      )}
    </form>
  );
}

export function ReportProblemForm({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("jobId", jobId);
    startTransition(async () => {
      const res = await reportProblemAction(fd);
      if (!res.success) {
        setError(res.message);
        return;
      }
      setOk(res.message);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      >
        <AlertTriangle className="h-4 w-4" />
        Report a problem
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-bold text-slate-900">Report a problem</p>
      <p className="text-xs text-slate-500">
        Unprotected jobs: this logs your issue for support. <strong>No refund guarantee.</strong>
      </p>
      <textarea
        name="reason"
        required
        minLength={10}
        rows={4}
        placeholder="Describe the problem…"
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
        disabled={pending || !!ok}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {ok && <p className="text-sm text-emerald-700">{ok}</p>}
      {!ok && (
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-800 px-4 text-sm font-bold text-white hover:bg-slate-900 disabled:opacity-60"
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Submit report
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="h-10 rounded-xl px-3 text-sm font-semibold text-slate-600"
          >
            Cancel
          </button>
        </div>
      )}
    </form>
  );
}
