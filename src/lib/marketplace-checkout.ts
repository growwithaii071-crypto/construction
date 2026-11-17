import prisma from "@/lib/prisma";
import {
  MarketplaceJobStatus,
  MarketplacePaymentStatus,
  QuoteStatus,
} from "@/generated/prisma";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { getAppUrl } from "@/lib/app-url";
import { getPricingConfig } from "@/lib/pricing";
import { toStripeAmount, STRIPE_CURRENCY, formatMoney } from "@/lib/money";
import { markMarketplacePaymentSucceeded } from "@/lib/marketplace-payments";

/**
 * Create (or reuse) a Stripe Checkout Session for the homeowner to pay a job.
 * Works for AWAITING_PAYMENT (legacy escrow) and AWARDED (optional platform pay).
 * Secret key stays server-side only.
 */
export async function createHomeownerCheckoutSession(
  jobId: string,
  clientUserId: string
) {
  if (!isStripeConfigured()) {
    throw new Error("Stripe is not configured.");
  }

  const job = await prisma.marketplaceJob.findUnique({
    where: { id: jobId },
    include: {
      payments: { orderBy: { createdAt: "desc" }, take: 1 },
      quotes: {
        where: { status: QuoteStatus.ACCEPTED },
        take: 1,
      },
    },
  });

  if (!job || job.clientId !== clientUserId) {
    throw new Error("Job not found.");
  }

  if (job.status === MarketplaceJobStatus.FUNDED) {
    return { alreadyPaid: true as const, jobId: job.id };
  }

  const allowed = [
    MarketplaceJobStatus.AWAITING_PAYMENT,
    MarketplaceJobStatus.AWARDED,
  ];
  if (!allowed.includes(job.status as (typeof allowed)[number])) {
    throw new Error("This job is not ready for checkout.");
  }

  const quote =
    job.quotes[0] ??
    (job.acceptedQuoteId
      ? await prisma.quote.findUnique({ where: { id: job.acceptedQuoteId } })
      : null);
  if (!quote) {
    throw new Error("No accepted quote for this job.");
  }

  let payment = job.payments[0] ?? null;

  if (payment?.status === MarketplacePaymentStatus.SUCCEEDED) {
    return { alreadyPaid: true as const, jobId: job.id };
  }

  if (!payment) {
    const config = await getPricingConfig();
    payment = await prisma.marketplacePayment.create({
      data: {
        jobId: job.id,
        quoteId: quote.id,
        quoteAmount: quote.amount,
        customerTotal: quote.amount,
        protectionOptedIn: false,
        protectionFee: 0,
        termsVersion: config.termsVersion,
        status: MarketplacePaymentStatus.PENDING,
      },
    });

    if (job.status === MarketplaceJobStatus.AWARDED) {
      await prisma.marketplaceJob.update({
        where: { id: job.id },
        data: { status: MarketplaceJobStatus.AWAITING_PAYMENT },
      });
    }
  }

  const stripe = getStripe();
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

  if (payment.stripeCheckoutSessionId) {
    try {
      const existing = await stripe.checkout.sessions.retrieve(
        payment.stripeCheckoutSessionId
      );
      if (existing.status === "complete") {
        const piId =
          typeof existing.payment_intent === "string"
            ? existing.payment_intent
            : existing.payment_intent?.id;
        if (piId) {
          await markMarketplacePaymentSucceeded({ paymentIntentId: piId });
        }
        return { alreadyPaid: true as const, jobId: job.id };
      }
      if (existing.status === "open" && existing.url) {
        return {
          alreadyPaid: false as const,
          url: existing.url,
          sessionId: existing.id,
          amount: payment.customerTotal,
        };
      }
    } catch {
      // create a fresh session below
    }
  }

  const base = getAppUrl();
  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      customer: customerId,
      customer_email: customerId ? undefined : client?.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: STRIPE_CURRENCY,
            unit_amount: toStripeAmount(payment.customerTotal),
            product_data: {
              name: `Job: ${job.title}`,
              description: `BuildPro secure checkout · ${formatMoney(payment.customerTotal)}`,
            },
          },
        },
      ],
      success_url: `${base}/customer/jobs/${job.id}/pay?paid=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/customer/jobs/${job.id}/pay?cancelled=1`,
      metadata: {
        buildproKind: "homeowner_checkout",
        buildproPaymentId: payment.id,
        buildproJobId: job.id,
        buildproQuoteId: quote.id,
      },
      payment_intent_data: {
        metadata: {
          buildproKind: "homeowner_checkout",
          buildproPaymentId: payment.id,
          buildproJobId: job.id,
          buildproQuoteId: quote.id,
        },
        description: `BuildPro job: ${job.title}`,
      },
    },
    { idempotencyKey: `checkout_${payment.id}_${toStripeAmount(payment.customerTotal)}` }
  );

  await prisma.marketplacePayment.update({
    where: { id: payment.id },
    data: {
      stripeCheckoutSessionId: session.id,
      status: MarketplacePaymentStatus.REQUIRES_ACTION,
    },
  });

  await prisma.auditLog.create({
    data: {
      entity: "marketplace_payment",
      entityId: payment.id,
      action: "checkout_session_created",
      actorId: clientUserId,
      after: {
        sessionId: session.id,
        amount: payment.customerTotal,
      },
    },
  });

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL.");
  }

  return {
    alreadyPaid: false as const,
    url: session.url,
    sessionId: session.id,
    amount: payment.customerTotal,
  };
}

/** Fulfill from checkout.session.completed webhook. */
export async function fulfillCheckoutSession(session: {
  id: string;
  payment_intent?: string | { id: string } | null;
  metadata?: Record<string, string> | null;
}) {
  const paymentId = session.metadata?.buildproPaymentId;
  const piId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  if (paymentId) {
    await prisma.marketplacePayment.updateMany({
      where: { id: paymentId },
      data: {
        stripeCheckoutSessionId: session.id,
        ...(piId ? { stripePaymentIntentId: piId } : {}),
      },
    });
  } else {
    await prisma.marketplacePayment.updateMany({
      where: { stripeCheckoutSessionId: session.id },
      data: piId ? { stripePaymentIntentId: piId } : {},
    });
  }

  if (piId) {
    return markMarketplacePaymentSucceeded({ paymentIntentId: piId });
  }

  // Fallback: mark by checkout session id if PI missing
  const payment = await prisma.marketplacePayment.findFirst({
    where: paymentId
      ? { id: paymentId }
      : { stripeCheckoutSessionId: session.id },
  });
  if (!payment) return { ok: false as const, reason: "not_found" };
  if (payment.status === MarketplacePaymentStatus.SUCCEEDED) {
    return { ok: true as const, duplicate: true, jobId: payment.jobId };
  }

  // Without PI id we still mark SUCCEEDED from Checkout completion
  await prisma.marketplacePayment.update({
    where: { id: payment.id },
    data: {
      status: MarketplacePaymentStatus.SUCCEEDED,
      stripeCheckoutSessionId: session.id,
    },
  });
  await prisma.marketplaceJob.updateMany({
    where: {
      id: payment.jobId,
      status: {
        in: [
          MarketplaceJobStatus.AWAITING_PAYMENT,
          MarketplaceJobStatus.AWARDED,
          MarketplaceJobStatus.OPEN,
          MarketplaceJobStatus.QUOTES_RECEIVED,
        ],
      },
    },
    data: { status: MarketplaceJobStatus.FUNDED },
  });
  return { ok: true as const, jobId: payment.jobId };
}
