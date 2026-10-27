import Stripe from "stripe";
import { appUrl } from "@/lib/email";

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function getStripePublishableKey() {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? "";
}

let stripeSingleton: Stripe | null = null;

/** Server-only Stripe client. Throws if STRIPE_SECRET_KEY is missing. */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error(
      "Stripe is not configured. Add STRIPE_SECRET_KEY to your environment."
    );
  }
  if (!stripeSingleton) {
    stripeSingleton = new Stripe(key, {
      typescript: true,
    });
  }
  return stripeSingleton;
}

export function connectReturnUrl() {
  return `${appUrl}/construction/payouts?connect=return`;
}

export function connectRefreshUrl() {
  return `${appUrl}/api/stripe/connect/refresh`;
}

export type TraderConnectStatus = {
  configured: boolean;
  accountId: string | null;
  onboardingDone: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  chargesEnabled: boolean;
  feeMethodSaved: boolean;
  verified: boolean;
  requirementsDue: string[];
};

export function computeVerified(opts: {
  onboardingDone: boolean;
  payoutsEnabled: boolean;
  feePaymentMethodId?: string | null;
}) {
  return Boolean(
    opts.onboardingDone && opts.payoutsEnabled && opts.feePaymentMethodId
  );
}
