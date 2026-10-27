"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Play, CheckCircle2, ThumbsUp } from "lucide-react";
import {
  startJobAction,
  completeJobAction,
  confirmJobAction,
  cancelFundedJobAction,
} from "@/actions/marketplace/lifecycle";

export function TraderJobActions({
  jobId,
  status,
}: {
  jobId: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ success: boolean; message: string }>) {
    startTransition(async () => {
      const res = await action();
      alert(res.message);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "FUNDED" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => startJobAction(jobId))}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-orange-500 px-4 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Mark started
        </button>
      )}
      {(status === "IN_PROGRESS" || status === "FUNDED") && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => completeJobAction(jobId))}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#0B2A4A] px-4 text-sm font-bold text-white hover:bg-[#163A5F] disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          Mark complete
        </button>
      )}
    </div>
  );
}

export function CustomerJobActions({
  jobId,
  status,
}: {
  jobId: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ success: boolean; message: string }>) {
    startTransition(async () => {
      const res = await action();
      alert(res.message);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {(status === "COMPLETED" || status === "IN_PROGRESS") && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => confirmJobAction(jobId))}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />}
          Confirm &amp; release payout
        </button>
      )}
      {(status === "FUNDED" || status === "AWAITING_PAYMENT") && (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (!confirm("Cancel before work starts? Fee will be voided and payment refunded if paid."))
              return;
            run(() => cancelFundedJobAction(jobId));
          }}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-200 px-4 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
        >
          Cancel before start
        </button>
      )}
    </div>
  );
}
