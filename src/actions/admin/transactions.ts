"use server";

import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import {
  UserRole,
  MarketplacePaymentStatus,
  MarketplaceJobStatus,
} from "@/generated/prisma";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { revalidatePath } from "next/cache";
import { markMarketplacePaymentRefunded } from "@/lib/marketplace-payments";

async function requireAdmin() {
  return requireAuth([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
}

/** Admin refund of a succeeded marketplace (homeowner) payment. */
export async function adminRefundPaymentAction(paymentId: string) {
  const session = await requireAdmin();
  const actorId = session.user.id!;

  if (!isStripeConfigured()) {
    return { success: false as const, message: "Stripe is not configured." };
  }

  const payment = await prisma.marketplacePayment.findUnique({
    where: { id: paymentId },
    include: { job: { select: { id: true, title: true, status: true } } },
  });

  if (!payment) {
    return { success: false as const, message: "Payment not found." };
  }

  if (
    payment.status !== MarketplacePaymentStatus.SUCCEEDED &&
    payment.status !== MarketplacePaymentStatus.PARTIALLY_REFUNDED
  ) {
    return {
      success: false as const,
      message: `Cannot refund payment in status ${payment.status}.`,
    };
  }

  if (!payment.stripePaymentIntentId) {
    return {
      success: false as const,
      message: "No Stripe PaymentIntent on this payment.",
    };
  }

  try {
    const stripe = getStripe();
    await stripe.refunds.create(
      { payment_intent: payment.stripePaymentIntentId },
      { idempotencyKey: `admin_refund_${payment.id}` }
    );

    await markMarketplacePaymentRefunded({
      paymentIntentId: payment.stripePaymentIntentId,
      partial: false,
    });

    if (
      [
        MarketplaceJobStatus.FUNDED,
        MarketplaceJobStatus.AWAITING_PAYMENT,
        MarketplaceJobStatus.IN_PROGRESS,
      ].includes(payment.job.status as never)
    ) {
      await prisma.marketplaceJob.update({
        where: { id: payment.jobId },
        data: { status: MarketplaceJobStatus.CANCELLED },
      });
    }

    await prisma.auditLog.create({
      data: {
        entity: "marketplace_payment",
        entityId: payment.id,
        action: "admin_refund",
        actorId,
        after: {
          paymentIntentId: payment.stripePaymentIntentId,
          jobId: payment.jobId,
        },
      },
    });

    revalidatePath("/transactions");
    revalidatePath(`/customer/jobs/${payment.jobId}`);
    return { success: true as const, message: "Refund submitted to Stripe." };
  } catch (err) {
    console.error("[ADMIN_REFUND]", err);
    return {
      success: false as const,
      message: err instanceof Error ? err.message : "Refund failed.",
    };
  }
}
