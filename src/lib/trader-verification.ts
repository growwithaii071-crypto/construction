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
