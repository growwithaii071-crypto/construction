"use client";

import { useEffect, useMemo, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useRouter } from "next/navigation";
import { Loader2, Shield, CheckCircle2, Lock } from "lucide-react";
import { getCheckoutBootstrapAction } from "@/actions/marketplace/payments";
import { CheckoutSkeleton } from "@/components/ui/checkout-skeleton";
import { BilingualAlert } from "@/components/ui/bilingual-alert";

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
  const [submitted, setSubmitted] = useState(false);

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

    setSubmitted(true);
    router.push(`/customer/jobs/${jobId}?paid=1`);
    router.refresh();
  }

  if (submitted) {
    return (
      <BilingualAlert
        tone="info"
        en="Payment submitted. Waiting for Stripe webhook to mark the job FUNDED…"
        hi="भुगतान भेज दिया गया। Stripe webhook से जॉब FUNDED होने तक प्रतीक्षा करें…"
      />
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <PaymentElement options={{ layout: "tabs" }} />
      {error && (
        <BilingualAlert
          tone="error"
          en={error}
          hi="भुगतान असफल। कार्ड जाँचें या दोबारा कोशिश करें।"
        />
      )}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing… · प्रोसेस हो रहा है…
          </>
        ) : (
          <>
            <Lock className="h-4 w-4" />
            Pay ₹{amount.toLocaleString("en-IN")}
          </>
        )}
      </button>
      <p className="text-center text-[11px] text-slate-400">
        Final status comes from Stripe webhook, not this screen alone.
        <br />
        अंतिम स्थिति webhook से अपडेट होती है।
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
      <BilingualAlert
        tone="warning"
        en="Checkout unavailable — STRIPE_PUBLISHABLE_KEY is not configured."
        hi="भुगतान उपलब्ध नहीं — Stripe publishable key सेट नहीं है।"
      />
    );
  }

  if (loading || !boot) {
    return <CheckoutSkeleton />;
  }

  if (!boot.success) {
    return (
      <BilingualAlert
        tone="error"
        en={boot.message}
        hi="चेकआउट शुरू नहीं हो सका। जॉब स्टेटस या Stripe सेटिंग जाँचें।"
      />
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
    return (
      <BilingualAlert
        tone="warning"
        en="Webhook pending or payment intent missing. Refresh in a moment."
        hi="Webhook लंबित है या पेमेंट इंटेंट नहीं मिला। थोड़ी देर बाद रिफ्रेश करें।"
      />
    );
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
                <Shield className="h-3.5 w-3.5 text-orange-500" /> Protection fee
              </span>
              <span>₹{boot.protectionFee.toLocaleString("en-IN")}</span>
            </div>
          ) : (
            <p className="text-xs text-slate-400">
              Unprotected — report-a-problem only, no refund guarantee.
            </p>
          )}
          <div className="flex justify-between border-t border-slate-100 pt-2 font-bold text-[#0B2A4A]">
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
