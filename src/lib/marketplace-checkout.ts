import prisma from "@/lib/prisma";
import {
  MarketplaceJobStatus,
  MarketplacePaymentStatus,
  QuoteStatus,
  FeeLedgerStatus,
  PayoutTransferStatus,
} from "@/generated/prisma";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { getAppUrl } from "@/lib/app-url";
import { getPricingConfig } from "@/lib/pricing";
import { toStripeAmount, STRIPE_CURRENCY, formatMoney } from "@/lib/money";
import { markMarketplacePaymentSucceeded } from "@/lib/marketplace-payments";
import { buildConnectSplit } from "@/lib/connect-split";
import { markCommissionPaid } from "@/lib/trader-billing";

/**
 * Create (or reuse) a Stripe Checkout Session for the homeowner to pay a job.
 * Auto-splits via Connect destination charge:
 *   application_fee_amount → HomeCreww
 *   transfer_data.destination → trader Connect account
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

  let payment = job.payments[0] ?? null;

  if (payment?.status === MarketplacePaymentStatus.SUCCEEDED) {
    return { alreadyPaid: true as const, jobId: job.id };
  }

  const config = await getPricingConfig();
  const split = buildConnectSplit(quote.amount, config);

  if (!payment) {
    payment = await prisma.marketplacePayment.create({
      data: {
        jobId: job.id,
        quoteId: quote.id,
        quoteAmount: quote.amount,
        customerTotal: split.charge,
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

  // Keep fee ledger in sync with current commission rate
  if (quote.feeLedger && quote.feeLedger.status === FeeLedgerStatus.PENDING) {
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
          await markMarketplacePaymentSucceeded({
            paymentIntentId: piId,
            autoSplit: true,
          });
        }
        return { alreadyPaid: true as const, jobId: job.id };
      }
      if (existing.status === "open" && existing.url) {
        return {
          alreadyPaid: false as const,
          url: existing.url,
          sessionId: existing.id,
          amount: payment.customerTotal,
          split,
        };
      }
    } catch {
      // create a fresh session below
    }
  }

  const base = getAppUrl();
  const feeLedgerId = quote.feeLedger?.id ?? "";

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
              name: `Job: ${job.title}`,
              description: `Auto-split · ${split.label}`,
            },
          },
        },
      ],
      success_url: `${base}/customer/jobs/${job.id}/pay?paid=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/customer/jobs/${job.id}/pay?cancelled=1`,
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
      },
      payment_intent_data: {
        application_fee_amount: split.applicationFeePence,
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
  const autoSplit = session.metadata?.buildproAutoSplit === "1";
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
    return markMarketplacePaymentSucceeded({
      paymentIntentId: piId,
      autoSplit,
      feeLedgerId: session.metadata?.buildproFeeLedgerId,
      applicationFee: session.metadata?.buildproApplicationFee
        ? Number(session.metadata.buildproApplicationFee)
        : undefined,
      traderNet: session.metadata?.buildproTraderNet
        ? Number(session.metadata.buildproTraderNet)
        : undefined,
    });
  }

  const payment = await prisma.marketplacePayment.findFirst({
    where: paymentId
      ? { id: paymentId }
      : { stripeCheckoutSessionId: session.id },
  });
  if (!payment) return { ok: false as const, reason: "not_found" };
  if (payment.status === MarketplacePaymentStatus.SUCCEEDED) {
    return { ok: true as const, duplicate: true, jobId: payment.jobId };
  }

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

  if (autoSplit && session.metadata?.buildproFeeLedgerId) {
    await markCommissionPaid({ feeLedgerId: session.metadata.buildproFeeLedgerId });
    const traderNet = Number(session.metadata.buildproTraderNet ?? 0);
    const quote = await prisma.quote.findUnique({
      where: { id: payment.quoteId },
      select: { traderId: true },
    });
    if (quote && traderNet > 0) {
      const existing = await prisma.payout.findFirst({ where: { jobId: payment.jobId } });
      if (!existing) {
        await prisma.payout.create({
          data: {
            traderId: quote.traderId,
            jobId: payment.jobId,
            netAmount: traderNet,
            stripeTransferId: `dest_cs_${session.id}`,
            status: PayoutTransferStatus.SUCCEEDED,
          },
        });
      }
    }
  }

  return { ok: true as const, jobId: payment.jobId };
}
