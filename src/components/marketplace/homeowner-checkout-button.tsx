"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CreditCard } from "lucide-react";
import { startHomeownerCheckoutAction } from "@/actions/marketplace/payments";
import { formatMoney } from "@/lib/money";

export function HomeownerCheckoutButton({
  jobId,
  amountHint,
}: {
  jobId: string;
  amountHint?: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onPay() {
    setError(null);
    startTransition(async () => {
      const res = await startHomeownerCheckoutAction(jobId);
      if (!res.success) {
        setError(res.message);
        return;
      }
      if (res.alreadyPaid) {
        router.push(`/customer/jobs/${jobId}?paid=1`);
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

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={onPay}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-60"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CreditCard className="h-4 w-4" />
        )}
        {amountHint != null
          ? `Pay securely · ${formatMoney(amountHint)}`
          : "Pay securely with Stripe"}
      </button>
      <p className="text-center text-[11px] text-slate-400">
        Hosted Stripe Checkout · card details never touch BuildPro servers
      </p>
    </div>
  );
}
