"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { payCommissionAction } from "@/actions/marketplace/billing";
import { BillingCheckout } from "@/components/contractor/billing-checkout";
import { formatMoney } from "@/lib/money";

export function PayCommissionPanel({
  jobId,
  amount,
  publishableKey,
}: {
  jobId: string;
  amount: number;
  publishableKey: string;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [checkout, setCheckout] = useState<{
    clientSecret: string;
    feeLedgerId: string;
    amount: number;
  } | null>(null);

  function startPay() {
    setError(null);
    start(async () => {
      const res = await payCommissionAction(jobId);
      if (!res.success) {
        setError(res.message);
        return;
      }
      setCheckout({
        clientSecret: res.clientSecret,
        feeLedgerId: res.feeLedgerId,
        amount: res.amount,
      });
    });
  }

  return (
    <div className="space-y-3 rounded-2xl border border-orange-200 bg-orange-50/50 p-5">
      <div>
        <h3 className="font-bold text-[#0B2A4A]">Pay platform commission</h3>
        <p className="mt-1 text-sm text-slate-600">
          Customer accepted your quote. Pay {formatMoney(amount)} commission to unlock starting
          work. An invoice is recorded automatically.
        </p>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!checkout ? (
        <button
          type="button"
          disabled={pending}
          onClick={startPay}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-orange-500 px-4 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Pay {formatMoney(amount)}
        </button>
      ) : (
        <BillingCheckout
          publishableKey={publishableKey}
          clientSecret={checkout.clientSecret}
          kind="commission"
          id={checkout.feeLedgerId}
          amount={checkout.amount}
          onDone={() => setCheckout(null)}
        />
      )}
    </div>
  );
}
