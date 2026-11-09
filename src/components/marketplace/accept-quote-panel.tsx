"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { acceptQuoteAction } from "@/actions/marketplace/quotes";
import { formatMoney } from "@/lib/money";
import type { PricePreview } from "@/lib/pricing";

type Props = {
  quoteId: string;
  traderName: string;
  preview: PricePreview;
  expired: boolean;
};

export function AcceptQuotePanel({ quoteId, traderName, preview, expired }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmExpired, setConfirmExpired] = useState(false);
  const [needsExpiredConfirm, setNeedsExpiredConfirm] = useState(expired);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function onAccept() {
    setError(null);
    setSuccess(null);
    const fd = new FormData();
    fd.set("quoteId", quoteId);
    if (confirmExpired) fd.set("confirmExpired", "true");

    startTransition(async () => {
      const res = await acceptQuoteAction(fd);
      if (!res.success) {
        if ("code" in res && res.code === "QUOTE_EXPIRED") {
          setError(res.message);
          setNeedsExpiredConfirm(true);
          return;
        }
        setError(res.message);
        return;
      }
      setSuccess(res.message);
      router.push(`/customer/jobs/${res.jobId}`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h3 className="font-bold text-slate-900">Accept quote from {traderName}</h3>
        <p className="mt-1 text-sm text-slate-500">
          You hire this trader at the quoted price. Pay them directly (off-platform). The trader
          then pays BuildPro commission.
        </p>
      </div>

      {expired && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          This quote’s validity window has passed. You can still accept after confirming below.
        </div>
      )}

      <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm">
        <div className="flex justify-between font-semibold text-slate-800">
          <span>Agreed job value</span>
          <span>{formatMoney(preview.quoteAmount)}</span>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Platform commission is paid by the trader · Terms {preview.termsVersion}
        </p>
      </div>

      {needsExpiredConfirm && (
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={confirmExpired}
            onChange={(e) => setConfirmExpired(e.target.checked)}
            className="mt-1"
          />
          I understand this quote expired and still want to accept this price.
        </label>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          {success}
        </div>
      )}

      <button
        type="button"
        disabled={pending || !!success || (needsExpiredConfirm && !confirmExpired)}
        onClick={onAccept}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-60"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Accepting…
          </>
        ) : (
          `Accept quote · ${formatMoney(preview.quoteAmount)}`
        )}
      </button>
    </div>
  );
}
