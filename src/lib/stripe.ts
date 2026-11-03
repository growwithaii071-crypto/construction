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

/** Mask secrets for admin UI — never return full keys. */
export function maskEnvSecret(value: string | undefined | null): string | null {
  const v = value?.trim() ?? "";
  if (!v) return null;
  if (v.length <= 10) return `${v.slice(0, 3)}…`;
  return `${v.slice(0, 7)}…${v.slice(-4)}`;
}

export type StripeEnvStatus = {
  secretConfigured: boolean;
  secretMasked: string | null;
  publishableConfigured: boolean;
  publishableMasked: string | null;
  webhookConfigured: boolean;
  webhookMasked: string | null;
  appUrl: string;
  webhookEndpointUrl: string;
  connectReturnUrl: string;
  connectRefreshUrl: string;
  /** Stripe account reachability when secret key is set */
  apiOk: boolean | null;
  apiError: string | null;
  livemode: boolean | null;
};

/** Server-only diagnostic for admin Stripe settings page. */
export async function getStripeEnvStatus(): Promise<StripeEnvStatus> {
  const secret = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  const publishable = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? "";
  const webhook = process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "";
  const base = appUrl.replace(/\/$/, "");

  const status: StripeEnvStatus = {
    secretConfigured: Boolean(secret),
    secretMasked: maskEnvSecret(secret),
    publishableConfigured: Boolean(publishable),
    publishableMasked: maskEnvSecret(publishable),
    webhookConfigured: Boolean(webhook),
    webhookMasked: maskEnvSecret(webhook),
    appUrl: base,
    webhookEndpointUrl: `${base}/api/stripe/webhook`,
    connectReturnUrl: connectReturnUrl(),
    connectRefreshUrl: connectRefreshUrl(),
    apiOk: null,
    apiError: null,
    livemode: null,
  };

  if (!secret) return status;

  try {
    const stripe = getStripe();
    await stripe.balance.retrieve();
    status.apiOk = true;
    status.livemode = secret.startsWith("sk_live");
  } catch (err) {
    status.apiOk = false;
    status.apiError =
      err instanceof Error ? err.message : "Could not reach Stripe API";
  }

  return status;
}
