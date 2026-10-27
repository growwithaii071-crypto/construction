import prisma from "@/lib/prisma";
import {
  MarketplaceJobStatus,
  MarketplacePaymentStatus,
} from "@/generated/prisma";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { createNotification } from "@/lib/notifications";

/** Stripe expects integer amount in smallest currency unit (paise for INR). */
export function toStripeAmount(rupees: number) {
  return Math.round(rupees * 100);
}

export function fromStripeAmount(paise: number) {
  return Math.round(paise) / 100;
}

/**
 * Mark payment succeeded from webhook (source of truth).
 * Idempotent if already SUCCEEDED / job already FUNDED+.
 */
export async function markMarketplacePaymentSucceeded(opts: {
  paymentIntentId: string;
  eventId?: string;
}) {
  const payment = await prisma.marketplacePayment.findFirst({
    where: { stripePaymentIntentId: opts.paymentIntentId },
    include: {
      job: { select: { id: true, title: true, clientId: true, status: true, acceptedQuoteId: true } },
      quote: { select: { traderId: true, amount: true } },
    },
  });

  if (!payment) {
    console.warn("[PAY_SUCCEEDED] No payment for PI", opts.paymentIntentId);
    return { ok: false as const, reason: "not_found" };
  }

  if (payment.status === MarketplacePaymentStatus.SUCCEEDED) {
    return { ok: true as const, duplicate: true, jobId: payment.jobId };
  }

  await prisma.$transaction(async (tx) => {
    await tx.marketplacePayment.update({
      where: { id: payment.id },
      data: { status: MarketplacePaymentStatus.SUCCEEDED },
    });

    if (
      payment.job.status === MarketplaceJobStatus.AWAITING_PAYMENT ||
      payment.job.status === MarketplaceJobStatus.OPEN ||
      payment.job.status === MarketplaceJobStatus.QUOTES_RECEIVED
    ) {
      await tx.marketplaceJob.update({
        where: { id: payment.jobId },
        data: { status: MarketplaceJobStatus.FUNDED },
      });
    }

    await tx.auditLog.create({
      data: {
        entity: "marketplace_payment",
        entityId: payment.id,
        action: "payment_succeeded",
        after: {
          paymentIntentId: opts.paymentIntentId,
          jobId: payment.jobId,
          customerTotal: payment.customerTotal,
          protectionOptedIn: payment.protectionOptedIn,
          eventId: opts.eventId ?? null,
        },
      },
    });
  });

  void createNotification({
    userId: payment.quote.traderId,
    title: "Job funded — you can start",
    message: `Payment received for “${payment.job.title}”. Funds are held on BuildPro until release rules apply.`,
    type: "SUCCESS",
    link: `/construction/jobs/${payment.jobId}`,
  });

  void createNotification({
    userId: payment.job.clientId,
    title: "Payment successful",
    message: `Your payment for “${payment.job.title}” is confirmed. The trader has been notified.`,
    type: "SUCCESS",
    link: `/customer/jobs/${payment.jobId}`,
  });

  return { ok: true as const, jobId: payment.jobId };
}

export async function markMarketplacePaymentFailed(opts: {
  paymentIntentId: string;
  eventId?: string;
}) {
  const payment = await prisma.marketplacePayment.findFirst({
    where: { stripePaymentIntentId: opts.paymentIntentId },
  });
  if (!payment) return;

  if (
    payment.status === MarketplacePaymentStatus.SUCCEEDED ||
    payment.status === MarketplacePaymentStatus.REFUNDED
  ) {
    return;
  }

  await prisma.marketplacePayment.update({
    where: { id: payment.id },
    data: { status: MarketplacePaymentStatus.FAILED },
  });

  await prisma.auditLog.create({
    data: {
      entity: "marketplace_payment",
      entityId: payment.id,
      action: "payment_failed",
      after: { paymentIntentId: opts.paymentIntentId, eventId: opts.eventId ?? null },
    },
  });
}

export async function markMarketplacePaymentRefunded(opts: {
  paymentIntentId: string;
  partial?: boolean;
  eventId?: string;
}) {
  const payment = await prisma.marketplacePayment.findFirst({
    where: { stripePaymentIntentId: opts.paymentIntentId },
    include: { job: { select: { id: true, title: true, clientId: true } } },
  });
  if (!payment) return;

  await prisma.marketplacePayment.update({
    where: { id: payment.id },
    data: {
      status: opts.partial
        ? MarketplacePaymentStatus.PARTIALLY_REFUNDED
        : MarketplacePaymentStatus.REFUNDED,
    },
  });

  await prisma.auditLog.create({
    data: {
      entity: "marketplace_payment",
      entityId: payment.id,
      action: opts.partial ? "payment_partially_refunded" : "payment_refunded",
      after: { paymentIntentId: opts.paymentIntentId, eventId: opts.eventId ?? null },
    },
  });
}

/** Create or reuse a PaymentIntent for a pending marketplace payment. */
export async function ensurePaymentIntent(paymentId: string, clientUserId: string) {
  if (!isStripeConfigured()) {
    throw new Error("Stripe is not configured.");
  }

  const payment = await prisma.marketplacePayment.findUnique({
    where: { id: paymentId },
    include: {
      job: { select: { id: true, title: true, clientId: true, status: true, protectionStatus: true } },
    },
  });

  if (!payment || payment.job.clientId !== clientUserId) {
    throw new Error("Payment not found.");
  }

  if (payment.job.status !== MarketplaceJobStatus.AWAITING_PAYMENT) {
    throw new Error("This job is not awaiting payment.");
  }

  if (payment.status === MarketplacePaymentStatus.SUCCEEDED) {
    throw new Error("Already paid.");
  }

  const stripe = getStripe();
  const amountPaise = toStripeAmount(payment.customerTotal);

  if (payment.stripePaymentIntentId) {
    const existing = await stripe.paymentIntents.retrieve(payment.stripePaymentIntentId);
    if (existing.status === "succeeded") {
      await markMarketplacePaymentSucceeded({ paymentIntentId: existing.id });
      throw new Error("Already paid.");
    }
    if (
      existing.status === "requires_payment_method" ||
      existing.status === "requires_confirmation" ||
      existing.status === "requires_action"
    ) {
      // Keep amount in sync if pricing changed (shouldn't after lock)
      if (existing.amount !== amountPaise) {
        const updated = await stripe.paymentIntents.update(existing.id, {
          amount: amountPaise,
        });
        return {
          clientSecret: updated.client_secret!,
          paymentIntentId: updated.id,
          amount: payment.customerTotal,
        };
      }
      return {
        clientSecret: existing.client_secret!,
        paymentIntentId: existing.id,
        amount: payment.customerTotal,
      };
    }
  }

  const client = await prisma.user.findUnique({
    where: { id: clientUserId },
    select: { email: true, name: true, stripeCustomerId: true },
  });

  let customerId = client?.stripeCustomerId ?? undefined;
  if (!customerId && client) {
    const customer = await stripe.customers.create({
      email: client.email,
      name: client.name ?? undefined,
      metadata: { buildproUserId: clientUserId },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: clientUserId },
      data: { stripeCustomerId: customerId },
    });
  }

  const intent = await stripe.paymentIntents.create(
    {
      amount: amountPaise,
      currency: "inr",
      customer: customerId,
      automatic_payment_methods: { enabled: true },
      metadata: {
        buildproPaymentId: payment.id,
        buildproJobId: payment.jobId,
        buildproQuoteId: payment.quoteId,
        protectionOptedIn: String(payment.protectionOptedIn),
        termsVersion: payment.termsVersion,
      },
      description: `BuildPro job: ${payment.job.title}`,
      // Separate charges & transfers — hold on platform; transfer on release (Phase 7)
    },
    { idempotencyKey: `mpay_create_${payment.id}` }
  );

  await prisma.marketplacePayment.update({
    where: { id: payment.id },
    data: {
      stripePaymentIntentId: intent.id,
      status: MarketplacePaymentStatus.REQUIRES_ACTION,
    },
  });

  await prisma.auditLog.create({
    data: {
      entity: "marketplace_payment",
      entityId: payment.id,
      action: "payment_intent_created",
      actorId: clientUserId,
      after: {
        paymentIntentId: intent.id,
        amount: payment.customerTotal,
        protectionOptedIn: payment.protectionOptedIn,
      },
    },
  });

  return {
    clientSecret: intent.client_secret!,
    paymentIntentId: intent.id,
    amount: payment.customerTotal,
  };
}
