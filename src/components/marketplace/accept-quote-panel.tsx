"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle2, Shield, ShieldOff } from "lucide-react";
import { acceptQuoteAction } from "@/actions/marketplace/quotes";
import { cn } from "@/lib/utils";
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
  const defaultProtected =
    preview.protectionEnabled && preview.protectionDefault === "OPT_OUT";
  const [protection, setProtection] = useState(defaultProtected);
  const [confirmExpired, setConfirmExpired] = useState(false);
  const [needsExpiredConfirm, setNeedsExpiredConfirm] = useState(expired);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const total = useMemo(
    () => (protection ? preview.customerTotalProtected : preview.customerTotalUnprotected),
    [protection, preview]
  );

  function onAccept() {
    setError(null);
    setSuccess(null);
    const fd = new FormData();
    fd.set("quoteId", quoteId);
    fd.set("protection", protection ? "true" : "false");
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
      router.push(`/customer/jobs/${res.jobId}/pay`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h3 className="font-bold text-slate-900">Accept quote from {traderName}</h3>
        <p className="mt-1 text-sm text-slate-500">
          Choose payment protection before continuing. Totals are calculated on the server.
        </p>
      </div>

      {expired && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          This quote’s validity window has passed. You can still accept after confirming below.
        </div>
      )}

      {preview.protectionEnabled ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setProtection(true)}
            className={cn(
              "rounded-2xl border p-4 text-left transition",
              protection
                ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                : "border-slate-200 hover:border-slate-300"
            )}
          >
            <p className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Shield className="h-4 w-4 text-blue-600" />
              Protected
            </p>
            <p className="mt-2 text-lg font-extrabold text-[#0B2A4A]">
              ₹{preview.customerTotalProtected.toLocaleString("en-IN")}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Quote ₹{preview.quoteAmount.toLocaleString("en-IN")} + protection ₹
              {preview.protectionFee.toLocaleString("en-IN")} (
              {(preview.protectionFeeRate * 100).toFixed(1)}%)
            </p>
            <p className="mt-2 text-[11px] leading-snug text-slate-400">
              Funds held until you confirm completion. Dispute mediation available.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setProtection(false)}
            className={cn(
              "rounded-2xl border p-4 text-left transition",
              !protection
                ? "border-slate-800 bg-slate-50 ring-2 ring-slate-300"
                : "border-slate-200 hover:border-slate-300"
            )}
          >
            <p className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <ShieldOff className="h-4 w-4 text-slate-500" />
              Unprotected
            </p>
            <p className="mt-2 text-lg font-extrabold text-[#0B2A4A]">
              ₹{preview.customerTotalUnprotected.toLocaleString("en-IN")}
            </p>
            <p className="mt-1 text-xs text-slate-500">Quote only — no protection fee</p>
            <p className="mt-2 text-[11px] leading-snug text-slate-400">
              Report-a-problem only. No refund guarantee. Still paid via BuildPro.
            </p>
          </button>
        </div>
      ) : (
        <p className="text-sm text-slate-600">
          Total: <strong>₹{preview.customerTotalUnprotected.toLocaleString("en-IN")}</strong>
        </p>
      )}

      <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm">
        <div className="flex justify-between font-semibold text-slate-800">
          <span>You pay</span>
          <span>₹{total.toLocaleString("en-IN")}</span>
        </div>
        <p className="mt-1 text-xs text-slate-400">Terms {preview.termsVersion}</p>
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
          `Accept & continue · ₹${total.toLocaleString("en-IN")}`
        )}
      </button>
    </div>
  );
}
