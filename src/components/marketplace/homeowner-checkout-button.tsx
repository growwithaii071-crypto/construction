"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CreditCard } from "lucide-react";
import { startHomeownerCheckoutAction } from "@/actions/marketplace/payments";
import { formatMoney } from "@/lib/money";

export function HomeownerCheckoutButton({
  jobId,
  remaining,
  dealTotal,
  firstPayment,
  disabled,
  returnPath,
  alreadyPaidPath,
}: {
  jobId: string;
  /** Amount still owed */
  remaining: number;
  dealTotal: number;
  /** True when platform commission will be taken on this payment */
  firstPayment: boolean;
  disabled?: boolean;
  /** Stripe success/cancel base path (defaults to job pay page) */
  returnPath?: string;
  alreadyPaidPath?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"full" | "partial">("full");
  const [partial, setPartial] = useState(
    remaining > 0 ? String(Math.min(remaining, Math.max(50, Math.round(remaining / 2)))) : ""
  );

  function onPay() {
    setError(null);
    const amount =
      mode === "full" ? remaining : Number(partial);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a valid payment amount.");
      return;
    }
    startTransition(async () => {
      const res = await startHomeownerCheckoutAction(jobId, amount, returnPath);
      if (!res.success) {
        setError(res.message);
        return;
      }
      if (res.alreadyPaid) {
        router.push(alreadyPaidPath ?? `/customer/jobs/${jobId}?paid=1`);
        router.refresh();
        return;
      }
      if ("url" in res && res.url) {
        window.location.href = res.url;
        return;
      }
      setError("No checkout URL returned.");
    });
  }

  if (remaining <= 0) {
    return (
      <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        Fully paid ({formatMoney(dealTotal)}).
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setMode("full")}
          className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${
            mode === "full"
              ? "border-orange-500 bg-orange-50 text-orange-900"
              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
          }`}
        >
          Pay in full
          <span className="mt-0.5 block text-xs font-normal text-slate-500">
            {formatMoney(remaining)} remaining
          </span>
        </button>
        <button
          type="button"
          onClick={() => setMode("partial")}
          className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${
            mode === "partial"
              ? "border-orange-500 bg-orange-50 text-orange-900"
              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
          }`}
        >
          Pay in parts
          <span className="mt-0.5 block text-xs font-normal text-slate-500">
            Choose an amount now
          </span>
        </button>
      </div>

      {mode === "partial" && (
        <div className="space-y-1.5">
          <label htmlFor="partialAmount" className="text-sm font-medium text-slate-700">
            Amount to pay now (£)
          </label>
          <input
            id="partialAmount"
            type="number"
            min={1}
            max={remaining}
            step="0.01"
            value={partial}
            onChange={(e) => setPartial(e.target.value)}
            className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
          />
          <p className="text-xs text-slate-400">
            Remaining after this:{" "}
            {formatMoney(
              Math.max(0, remaining - (Number(partial) || 0))
            )}
          </p>
        </div>
      )}

      {firstPayment && (
        <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          Platform commission is taken on this first payment only. Later installments go to the
          trader with no extra platform fee.
        </p>
      )}

      <button
        type="button"
        disabled={pending || disabled}
        onClick={onPay}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-60"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CreditCard className="h-4 w-4" />
        )}
        {mode === "full"
          ? `Pay full remaining · ${formatMoney(remaining)}`
          : `Pay now · ${formatMoney(Number(partial) || 0)}`}
      </button>
    </div>
  );
}
