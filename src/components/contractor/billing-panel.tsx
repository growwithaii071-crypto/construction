"use client";

import { useState, useTransition } from "react";
import { Loader2, CreditCard, Infinity as InfinityIcon } from "lucide-react";
import {
  buyCreditPackAction,
  buySubscriptionAction,
} from "@/actions/marketplace/billing";
import { BillingCheckout } from "@/components/contractor/billing-checkout";
import { formatMoney } from "@/lib/money";

export function BillingPanel({
  publishableKey,
  credits,
  subscribed,
  subscriptionEndsAt,
  packPrice,
  packSize,
  subPrice,
  subDays,
  commissionRate,
}: {
  publishableKey: string;
  credits: number;
  subscribed: boolean;
  subscriptionEndsAt: string | null;
  packPrice: number;
  packSize: number;
  subPrice: number;
  subDays: number;
  commissionRate: number;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [checkout, setCheckout] = useState<{
    kind: "credits" | "subscription";
    id: string;
    clientSecret: string;
    amount: number;
  } | null>(null);

  function buyCredits() {
    setError(null);
    start(async () => {
      const res = await buyCreditPackAction();
      if (!res.success) {
        setError(res.message);
        return;
      }
      setCheckout({
        kind: "credits",
        id: res.purchaseId,
        clientSecret: res.clientSecret,
        amount: res.amount,
      });
    });
  }

  function buySub() {
    setError(null);
    start(async () => {
      const res = await buySubscriptionAction();
      if (!res.success) {
        setError(res.message);
        return;
      }
      setCheckout({
        kind: "subscription",
        id: res.subscriptionId,
        clientSecret: res.clientSecret,
        amount: res.amount,
      });
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Quote credits
          </p>
          <p className="mt-2 text-3xl font-extrabold text-[#0B2A4A]">{credits}</p>
          <p className="mt-1 text-sm text-slate-500">
            1 credit = 1 quote · Pack: {packSize} for {formatMoney(packPrice)}
          </p>
          <button
            type="button"
            disabled={pending || Boolean(checkout)}
            onClick={buyCredits}
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-orange-500 px-4 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-60"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
            Buy {packSize} credits
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Subscription
          </p>
          <p className="mt-2 text-3xl font-extrabold text-[#0B2A4A]">
            {subscribed ? "Active" : formatMoney(subPrice)}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {subscribed && subscriptionEndsAt
              ? `Unlimited quotes until ${new Date(subscriptionEndsAt).toLocaleDateString("en-GB")}`
              : `${subDays} days · unlimited quotes`}
          </p>
          {!subscribed && (
            <button
              type="button"
              disabled={pending || Boolean(checkout)}
              onClick={buySub}
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-[#0B2A4A] px-4 text-sm font-bold text-white hover:bg-[#0a2440] disabled:opacity-60"
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <InfinityIcon className="h-4 w-4" />
              )}
              Subscribe
            </button>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-500">
        After a customer accepts your quote, you pay platform commission (
        {(commissionRate * 100).toFixed(0)}% of job value). An invoice is issued automatically.
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {checkout && (
        <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-5">
          <h3 className="mb-3 font-bold text-[#0B2A4A]">Complete payment</h3>
          <BillingCheckout
            publishableKey={publishableKey}
            clientSecret={checkout.clientSecret}
            kind={checkout.kind}
            id={checkout.id}
            amount={checkout.amount}
            onDone={() => setCheckout(null)}
          />
        </div>
      )}
    </div>
  );
}
