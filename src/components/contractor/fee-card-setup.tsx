"use client";

import { useEffect, useMemo, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Loader2, CreditCard, CheckCircle2, AlertCircle } from "lucide-react";
import {
  createFeeSetupIntentAction,
  saveFeePaymentMethodAction,
} from "@/actions/stripe/connect";

function SetupForm({ onSaved }: { onSaved: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);

    const result = await stripe.confirmSetup({
      elements,
      redirect: "if_required",
      confirmParams: {
        return_url: `${window.location.origin}/construction/payouts?fee=return`,
      },
    });

    if (result.error) {
      setError(result.error.message ?? "Could not save card.");
      setLoading(false);
      return;
    }

    const pm =
      typeof result.setupIntent?.payment_method === "string"
        ? result.setupIntent.payment_method
        : result.setupIntent?.payment_method?.id;

    if (!pm) {
      setError("Payment method missing after setup.");
      setLoading(false);
      return;
    }

    const saved = await saveFeePaymentMethodAction(pm);
    if (!saved.success) {
      setError(saved.message);
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
    onSaved();
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        <CheckCircle2 className="h-4 w-4" />
        Card saved for success-fee authorization.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement options={{ layout: "tabs" }} />
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0B2A4A] text-sm font-bold text-white hover:bg-[#163A5F] disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving…
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4" />
            Save card for fees
          </>
        )}
      </button>
      <p className="text-xs text-slate-400">
        Nothing is charged now. This authorizes BuildPro to deduct the trader success fee at payout.
      </p>
    </form>
  );
}

export function FeeCardSetup({
  publishableKey,
  alreadySaved,
  onSaved,
}: {
  publishableKey: string;
  alreadySaved: boolean;
  onSaved: () => void;
}) {
  const stripePromise = useMemo(
    () => (publishableKey ? loadStripe(publishableKey) : null),
    [publishableKey]
  );
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (alreadySaved || !publishableKey) return;
    let cancelled = false;
    setLoading(true);
    createFeeSetupIntentAction().then((res) => {
      if (cancelled) return;
      setLoading(false);
      if (!res.success) {
        setError(res.message);
        return;
      }
      setClientSecret(res.clientSecret);
    });
    return () => {
      cancelled = true;
    };
  }, [alreadySaved, publishableKey]);

  if (alreadySaved) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
        <CheckCircle2 className="h-4 w-4" />
        Fee payment method on file
      </div>
    );
  }

  if (!publishableKey) {
    return (
      <p className="text-sm text-amber-700">
        Add <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> to
        enable card setup.
      </p>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Preparing secure card form…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        {error}
      </div>
    );
  }

  if (!clientSecret || !stripePromise) return null;

  return (
    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "stripe" } }}>
      <SetupForm onSaved={onSaved} />
    </Elements>
  );
}
