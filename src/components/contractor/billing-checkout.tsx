"use client";

import { useMemo, useState, useTransition } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { Loader2 } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { confirmBillingPaymentAction } from "@/actions/marketplace/billing";
import { useRouter } from "next/navigation";

function CheckoutForm({
  kind,
  id,
  amount,
  onDone,
}: {
  kind: "credits" | "subscription" | "commission";
  id: string;
  amount: number;
  onDone: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setError(null);
    start(async () => {
      const { error: err, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });
      if (err) {
        setError(err.message ?? "Payment failed");
        return;
      }
      if (paymentIntent?.status === "succeeded") {
        await confirmBillingPaymentAction({ kind, id });
        onDone();
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <PaymentElement />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || pending}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Pay {formatMoney(amount)}
      </button>
    </form>
  );
}

export function BillingCheckout({
  publishableKey,
  clientSecret,
  kind,
  id,
  amount,
  onDone,
}: {
  publishableKey: string;
  clientSecret: string;
  kind: "credits" | "subscription" | "commission";
  id: string;
  amount: number;
  onDone: () => void;
}) {
  const stripePromise = useMemo(
    () => (publishableKey ? loadStripe(publishableKey) : null),
    [publishableKey]
  );

  if (!publishableKey) {
    return <p className="text-sm text-red-600">Stripe publishable key missing.</p>;
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm kind={kind} id={id} amount={amount} onDone={onDone} />
    </Elements>
  );
}
