import prisma from "@/lib/prisma";
import { computeVerified } from "@/lib/stripe";

/** Spec: verified = Connect onboarding done + payouts enabled + fee method on file. */
export async function getTraderVerification(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      stripeAccountId: true,
      stripeCustomerId: true,
      stripeOnboardingDone: true,
      stripePayoutsEnabled: true,
      feePaymentMethodId: true,
    },
  });

  if (!user) return null;

  const verified = computeVerified({
    onboardingDone: user.stripeOnboardingDone,
    payoutsEnabled: user.stripePayoutsEnabled,
    feePaymentMethodId: user.feePaymentMethodId,
  });

  return { ...user, verified };
}

export async function assertTraderVerified(userId: string) {
  const status = await getTraderVerification(userId);
  if (!status?.verified) {
    throw new Error(
      "Complete Stripe Connect verification and save a fee payment method before quoting."
    );
  }
  return status;
}

/** Eligibility for Connect transfers / payouts. */
export async function getPayoutEligibility(userId: string) {
  const status = await getTraderVerification(userId);
  if (!status) {
    return {
      eligible: false as const,
      reason: "Trader not found.",
      stripeAccountId: null as string | null,
      verified: false,
    };
  }
  if (!status.stripeAccountId) {
    return {
      eligible: false as const,
      reason: "No Stripe connected account. Complete onboarding first.",
      stripeAccountId: null,
      verified: false,
    };
  }
  if (!status.stripeOnboardingDone) {
    return {
      eligible: false as const,
      reason: "Connect onboarding incomplete.",
      stripeAccountId: status.stripeAccountId,
      verified: false,
    };
  }
  if (!status.stripePayoutsEnabled) {
    return {
      eligible: false as const,
      reason: "Payouts not enabled on the connected account yet.",
      stripeAccountId: status.stripeAccountId,
      verified: false,
    };
  }
  return {
    eligible: true as const,
    reason: null as string | null,
    stripeAccountId: status.stripeAccountId,
    verified: status.verified,
  };
}
