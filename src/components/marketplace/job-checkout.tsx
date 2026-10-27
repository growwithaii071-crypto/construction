"use client";

import { useEffect, useMemo, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useRouter } from "next/navigation";
import { Loader2, Shield, AlertCircle, CheckCircle2, Lock } from "lucide-react";
import { getCheckoutBootstrapAction } from "@/actions/marketplace/payments";

function CheckoutForm({
  amount,
  jobId,
}: {
  amount: number;
  jobId: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);

    const result = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: {
        return_url: `${window.location.origin}/customer/jobs/${jobId}/pay?paid=1`,
      },
    });

    if (result.error) {
      setError(result.error.message ?? "Payment failed.");
      setLoading(false);
      return;
    }

    // Webhook is source of truth; refresh after short delay
    router.push(`/customer/jobs/${jobId}?paid=1`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
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
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing…
          </>
        ) : (
          <>
            <Lock className="h-4 w-4" />
            Pay ₹{amount.toLocaleString("en-IN")}
          </>
        )}
      </button>
      <p className="text-center text-[11px] text-slate-400">
        Payment status is confirmed by Stripe webhooks — not the browser redirect alone.
      </p>
    </form>
  );
}

export function JobCheckout({
  jobId,
  publishableKey,
}: {
  jobId: string;
  publishableKey: string;
}) {
  const router = useRouter();
  const stripePromise = useMemo(
    () => (publishableKey ? loadStripe(publishableKey) : null),
    [publishableKey]
  );
  const [boot, setBoot] = useState<Awaited<ReturnType<typeof getCheckoutBootstrapAction>> | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getCheckoutBootstrapAction(jobId).then((res) => {
      if (cancelled) return;
      setBoot(res);
      setLoading(false);
      if (res.success && "alreadyPaid" in res && res.alreadyPaid) {
        router.replace(`/customer/jobs/${jobId}`);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [jobId, router]);

  if (!publishableKey) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Add <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> to
        enable checkout.
      </div>
    );
  }

  if (loading || !boot) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Preparing secure checkout…
      </div>
    );
  }

  if (!boot.success) {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        {boot.message}
      </div>
    );
  }

  if ("alreadyPaid" in boot && boot.alreadyPaid) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        <CheckCircle2 className="h-4 w-4" />
        {boot.message}
      </div>
    );
  }

  if (!("clientSecret" in boot) || !boot.clientSecret || !stripePromise) {
    return null;
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-bold text-slate-900">{boot.jobTitle}</h2>
        <div className="mt-3 space-y-1.5 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Quote</span>
            <span>₹{boot.quoteAmount.toLocaleString("en-IN")}</span>
          </div>
          {boot.protectionOptedIn ? (
            <div className="flex justify-between text-slate-600">
              <span className="inline-flex items-center gap-1">
                <Shield className="h-3.5 w-3.5 text-blue-600" /> Protection fee
              </span>
              <span>₹{boot.protectionFee.toLocaleString("en-IN")}</span>
            </div>
          ) : (
            <p className="text-xs text-slate-400">
              Unprotected — report-a-problem only, no refund guarantee. Still paid via BuildPro.
            </p>
          )}
          <div className="flex justify-between border-t border-slate-100 pt-2 font-bold text-slate-900">
            <span>Total</span>
            <span>₹{boot.amount.toLocaleString("en-IN")}</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Protection choice locked · Terms {boot.termsVersion}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <Elements
          stripe={stripePromise}
          options={{ clientSecret: boot.clientSecret, appearance: { theme: "stripe" } }}
        >
          <CheckoutForm amount={boot.amount} jobId={jobId} />
        </Elements>
      </div>
    </div>
  );
}
