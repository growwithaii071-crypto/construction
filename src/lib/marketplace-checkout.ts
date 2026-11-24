import prisma from "@/lib/prisma";
import {
  MarketplaceJobStatus,
  MarketplacePaymentStatus,
  QuoteStatus,
  FeeLedgerStatus,
} from "@/generated/prisma";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { getAppUrl, withVercelProtectionBypass } from "@/lib/app-url";
import { getPricingConfig } from "@/lib/pricing";
import { STRIPE_CURRENCY, formatMoney } from "@/lib/money";
import { markMarketplacePaymentSucceeded } from "@/lib/marketplace-payments";
import { buildConnectSplit } from "@/lib/connect-split";

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Create a Stripe Checkout Session for the homeowner.
 * Supports full or partial (installment) payments.
 * Platform commission is taken only on the first successful payment for the deal.
 */
export async function createHomeownerCheckoutSession(
  jobId: string,
  clientUserId: string,
  payAmount?: number | null,
  returnPath?: string | null
) {
  if (!isStripeConfigured()) {
    throw new Error("Stripe is not configured.");
  }

  const job = await prisma.marketplaceJob.findUnique({
    where: { id: jobId },
    include: {
      serviceRequest: { select: { id: true } },
      payments: {
        where: { status: MarketplacePaymentStatus.SUCCEEDED },
        orderBy: { createdAt: "asc" },
      },
      quotes: {
        where: { status: QuoteStatus.ACCEPTED },
        take: 1,
        include: {
          trader: {
            select: {
              id: true,
              name: true,
              stripeAccountId: true,
              stripeOnboardingDone: true,
              stripePayoutsEnabled: true,
            },
          },
          feeLedger: true,
        },
      },
    },
  });

  if (!job || job.clientId !== clientUserId) {
    throw new Error("Job not found.");
  }

  const quote =
    job.quotes[0] ??
    (job.acceptedQuoteId
      ? await prisma.quote.findUnique({
          where: { id: job.acceptedQuoteId },
          include: {
            trader: {
              select: {
                id: true,
                name: true,
                stripeAccountId: true,
                stripeOnboardingDone: true,
                stripePayoutsEnabled: true,
              },
            },
            feeLedger: true,
          },
        })
      : null);
  if (!quote) {
    throw new Error("No accepted quote for this job.");
  }

  const dealTotal = quote.amount;
  const amountPaid = job.amountPaid ?? 0;
  const remaining = round2(Math.max(0, dealTotal - amountPaid));

  if (remaining <= 0) {
    return { alreadyPaid: true as const, jobId: job.id };
  }

  const allowed = [
    MarketplaceJobStatus.AWAITING_PAYMENT,
    MarketplaceJobStatus.AWARDED,
    MarketplaceJobStatus.FUNDED,
    MarketplaceJobStatus.IN_PROGRESS,
  ];
  if (!allowed.includes(job.status as (typeof allowed)[number])) {
    throw new Error("This job is not ready for checkout.");
  }

  const trader = quote.trader;
  if (!trader.stripeAccountId) {
    throw new Error(
      "This trader has not connected Stripe yet. They must finish payouts setup before you can pay."
    );
  }
  if (!trader.stripeOnboardingDone || !trader.stripePayoutsEnabled) {
    throw new Error(
      "This trader’s Stripe account is not ready to receive payouts yet."
    );
  }

  let charge = remaining;
  if (payAmount != null && Number.isFinite(payAmount)) {
    charge = round2(payAmount);
    if (charge < 1) {
      throw new Error("Minimum payment is £1.");
    }
    if (charge > remaining + 0.001) {
      throw new Error(`You can pay at most ${formatMoney(remaining)} remaining.`);
    }
  }

  const succeededCount = job.payments.length;
  const commissionAlreadyTaken =
    quote.feeLedger?.status === FeeLedgerStatus.COLLECTED ||
    job.payments.some((p) => p.takesCommission);
  const takeCommission = !commissionAlreadyTaken;

  const config = await getPricingConfig();
  const split = buildConnectSplit(charge, config, {
    takeCommission,
    dealTotal,
  });

  if (takeCommission && split.applicationFee > 0 && charge <= split.applicationFee) {
    throw new Error(
      `First payment must be greater than the platform commission (${formatMoney(split.applicationFee)}). Pay at least ${formatMoney(round2(split.applicationFee + 1))}.`
    );
  }

  const sequence = succeededCount + 1;

  const payment = await prisma.marketplacePayment.create({
    data: {
      jobId: job.id,
      quoteId: quote.id,
      quoteAmount: dealTotal,
      customerTotal: split.charge,
      protectionOptedIn: false,
      protectionFee: 0,
      termsVersion: config.termsVersion,
      status: MarketplacePaymentStatus.PENDING,
      sequence,
      takesCommission: split.takesCommission,
    },
  });

  if (job.status === MarketplaceJobStatus.AWARDED) {
    await prisma.marketplaceJob.update({
      where: { id: job.id },
      data: { status: MarketplaceJobStatus.AWAITING_PAYMENT },
    });
  }

  if (
    takeCommission &&
    quote.feeLedger &&
    quote.feeLedger.status === FeeLedgerStatus.PENDING
  ) {
    await prisma.feeLedger.update({
      where: { id: quote.feeLedger.id },
      data: { amount: split.applicationFee, rate: split.rate },
    });
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

  const base = getAppUrl();
  const feeLedgerId = quote.feeLedger?.id ?? "";
  const installmentLabel =
    charge < remaining || amountPaid > 0
      ? `Payment ${sequence} · ${formatMoney(charge)} of ${formatMoney(dealTotal)}`
      : `Full payment · ${formatMoney(charge)}`;

  const safeReturn =
    returnPath &&
    returnPath.startsWith("/") &&
    !returnPath.startsWith("//") &&
    (returnPath.startsWith("/customer/jobs/") ||
      returnPath.startsWith("/customer/requests/"))
      ? returnPath
      : job.serviceRequest
        ? `/customer/requests/${job.serviceRequest.id}/pay`
        : `/customer/jobs/${job.id}/pay`;
  const payReturnBase = `${base}${safeReturn}`;

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
            unit_amount: split.chargePence,
            product_data: {
              name: job.serviceRequest ? `Service: ${job.title}` : `Job: ${job.title}`,
              description: `${installmentLabel} · ${split.label}`,
            },
          },
        },
      ],
      success_url: withVercelProtectionBypass(
        `${payReturnBase}?paid=1&session_id={CHECKOUT_SESSION_ID}`
      ),
      cancel_url: withVercelProtectionBypass(`${payReturnBase}?cancelled=1`),
      metadata: {
        buildproKind: "homeowner_checkout",
        buildproAutoSplit: "1",
        buildproPaymentId: payment.id,
        buildproJobId: job.id,
        buildproQuoteId: quote.id,
        buildproFeeLedgerId: feeLedgerId,
        buildproApplicationFee: String(split.applicationFee),
        buildproTraderNet: String(split.traderNet),
        buildproCommissionRate: String(split.rate),
        buildproTakesCommission: split.takesCommission ? "1" : "0",
        buildproSequence: String(sequence),
      },
      payment_intent_data: {
        application_fee_amount: split.applicationFeePence > 0 ? split.applicationFeePence : undefined,
        transfer_data: {
          destination: trader.stripeAccountId,
        },
        metadata: {
          buildproKind: "homeowner_checkout",
          buildproAutoSplit: "1",
          buildproPaymentId: payment.id,
          buildproJobId: job.id,
          buildproQuoteId: quote.id,
          buildproFeeLedgerId: feeLedgerId,
          buildproApplicationFee: String(split.applicationFee),
          buildproTraderNet: String(split.traderNet),
          buildproCommissionRate: String(split.rate),
          buildproTakesCommission: split.takesCommission ? "1" : "0",
          buildproSequence: String(sequence),
        },
        description: `HomeCreww job: ${job.title} · ${split.label}`,
      },
    },
    {
      idempotencyKey: `checkout_split_${payment.id}_${split.chargePence}_${split.applicationFeePence}_${trader.stripeAccountId}`,
    }
  );

  await prisma.marketplacePayment.update({
    where: { id: payment.id },
    data: {
      stripeCheckoutSessionId: session.id,
      customerTotal: split.charge,
      status: MarketplacePaymentStatus.REQUIRES_ACTION,
    },
  });

  await prisma.auditLog.create({
    data: {
      entity: "marketplace_payment",
      entityId: payment.id,
      action: "checkout_session_created_autosplit",
      actorId: clientUserId,
      after: {
        sessionId: session.id,
        amount: split.charge,
        applicationFee: split.applicationFee,
        traderNet: split.traderNet,
        rate: split.rate,
        sequence,
        takesCommission: split.takesCommission,
        destination: trader.stripeAccountId,
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
    amount: split.charge,
    remaining: round2(remaining - split.charge),
    split,
  };
}

/** Fulfill from checkout.session.completed webhook. */
export async function fulfillCheckoutSession(session: {
  id: string;
  payment_intent?: string | { id: string } | null;
  metadata?: Record<string, string> | null;
}) {
  const paymentId = session.metadata?.buildproPaymentId;
  const jobId = session.metadata?.buildproJobId;
  const piRaw = session.payment_intent;
  const paymentIntentId =
    typeof piRaw === "string" ? piRaw : piRaw && typeof piRaw === "object" ? piRaw.id : null;

  if (!paymentIntentId) {
    console.warn("[CHECKOUT_FULFILL] No payment_intent on session", session.id);
    return { ok: false as const, reason: "no_pi" };
  }

  if (paymentId) {
    await prisma.marketplacePayment.updateMany({
      where: { id: paymentId, stripePaymentIntentId: null },
      data: { stripePaymentIntentId: paymentIntentId },
    });
  } else if (jobId) {
    await prisma.marketplacePayment.updateMany({
      where: {
        jobId,
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId: null,
      },
      data: { stripePaymentIntentId: paymentIntentId },
    });
  }

  return markMarketplacePaymentSucceeded({
    paymentIntentId,
    autoSplit: session.metadata?.buildproAutoSplit === "1",
    feeLedgerId: session.metadata?.buildproFeeLedgerId || undefined,
    applicationFee: session.metadata?.buildproApplicationFee
      ? Number(session.metadata.buildproApplicationFee)
      : undefined,
    traderNet: session.metadata?.buildproTraderNet
      ? Number(session.metadata.buildproTraderNet)
      : undefined,
  });
}
