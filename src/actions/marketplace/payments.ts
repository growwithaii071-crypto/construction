"use server";

import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { UserRole, MarketplaceJobStatus, MarketplacePaymentStatus } from "@/generated/prisma";
import { ensurePaymentIntent } from "@/lib/marketplace-payments";
import { createHomeownerCheckoutSession } from "@/lib/marketplace-checkout";
import { isStripeConfigured } from "@/lib/stripe";
import { revalidatePath } from "next/cache";

/** Preferred: Stripe Checkout Session (hosted). Secret key never leaves the server. */
export async function startHomeownerCheckoutAction(
  jobId: string,
  payAmount?: number | null,
  returnPath?: string | null
) {
  const session = await requireAuth([UserRole.CLIENT]);
  const clientId = session.user.id!;

  if (!isStripeConfigured()) {
    return {
      success: false as const,
      message: "Stripe is not configured. Add STRIPE_SECRET_KEY and publishable key.",
    };
  }

  try {
    const result = await createHomeownerCheckoutSession(jobId, clientId, payAmount, returnPath);
    revalidatePath(`/customer/jobs/${jobId}`);
    revalidatePath(`/customer/jobs/${jobId}/pay`);
    if (result.alreadyPaid) {
      return {
        success: true as const,
        alreadyPaid: true as const,
        jobId: result.jobId,
        message: "This job is already fully paid.",
      };
    }
    return {
      success: true as const,
      alreadyPaid: false as const,
      url: result.url,
      sessionId: result.sessionId,
      amount: result.amount,
      remaining: "remaining" in result ? result.remaining : undefined,
    };
  } catch (err) {
    console.error("[HOMEOWNER_CHECKOUT]", err);
    return {
      success: false as const,
      message: err instanceof Error ? err.message : "Could not start checkout.",
    };
  }
}

/** Legacy Elements PaymentIntent bootstrap (kept for older clients). */
export async function getCheckoutBootstrapAction(jobId: string) {
  const session = await requireAuth([UserRole.CLIENT]);
  const clientId = session.user.id!;

  if (!isStripeConfigured()) {
    return {
      success: false as const,
      message: "Stripe is not configured. Add STRIPE_SECRET_KEY and publishable key.",
    };
  }

  const job = await prisma.marketplaceJob.findUnique({
    where: { id: jobId },
    include: {
      payments: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!job || job.clientId !== clientId) {
    return { success: false as const, message: "Job not found." };
  }

  if (job.status === MarketplaceJobStatus.FUNDED) {
    return {
      success: true as const,
      alreadyPaid: true as const,
      jobId: job.id,
      message: "This job is already funded.",
    };
  }

  if (job.status !== MarketplaceJobStatus.AWAITING_PAYMENT) {
    return { success: false as const, message: "This job is not awaiting payment." };
  }

  const payment = job.payments[0];
  if (!payment) {
    return { success: false as const, message: "No payment record. Accept a quote first." };
  }

  if (payment.status === MarketplacePaymentStatus.SUCCEEDED) {
    return {
      success: true as const,
      alreadyPaid: true as const,
      jobId: job.id,
      message: "Payment already completed.",
    };
  }

  try {
    const intent = await ensurePaymentIntent(payment.id, clientId);
    revalidatePath(`/customer/jobs/${jobId}`);
    return {
      success: true as const,
      alreadyPaid: false as const,
      clientSecret: intent.clientSecret,
      paymentIntentId: intent.paymentIntentId,
      amount: intent.amount,
      protectionOptedIn: payment.protectionOptedIn,
      protectionFee: payment.protectionFee,
      quoteAmount: payment.quoteAmount,
      termsVersion: payment.termsVersion,
      jobTitle: job.title,
      protectionStatus: job.protectionStatus,
    };
  } catch (err) {
    console.error("[CHECKOUT_BOOTSTRAP]", err);
    return {
      success: false as const,
      message: err instanceof Error ? err.message : "Could not start checkout.",
    };
  }
}
