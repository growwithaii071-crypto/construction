import prisma from "@/lib/prisma";
import {
  MarketplaceJobStatus,
  MarketplacePaymentStatus,
  PayoutTransferStatus,
} from "@/generated/prisma";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { notifyUserWithEmail } from "@/lib/marketplace-notify";
import {
  formatMoney,
  toStripeAmount,
  fromStripeAmount,
  STRIPE_CURRENCY,
} from "@/lib/money";
import { markCommissionPaid } from "@/lib/trader-billing";
import { buildConnectSplit } from "@/lib/connect-split";
import { getPricingConfig } from "@/lib/pricing";

export { toStripeAmount, fromStripeAmount };

/**
 * Mark payment succeeded from webhook (source of truth).
 * Idempotent if already SUCCEEDED / job already FUNDED+.
 * When autoSplit=true (Connect destination charge), commission is collected
 * via application_fee and trader already received transfer_data funds.
 */
export async function markMarketplacePaymentSucceeded(opts: {
  paymentIntentId: string;
  eventId?: string;
  autoSplit?: boolean;
  feeLedgerId?: string;
  applicationFee?: number;
  traderNet?: number;
}) {
  const payment = await prisma.marketplacePayment.findFirst({
    where: { stripePaymentIntentId: opts.paymentIntentId },
    include: {
      job: { select: { id: true, title: true, clientId: true, status: true, acceptedQuoteId: true } },
      quote: { select: { id: true, traderId: true, amount: true, feeLedger: true } },
    },
  });

  if (!payment) {
    console.warn("[PAY_SUCCEEDED] No payment for PI", opts.paymentIntentId);
    return { ok: false as const, reason: "not_found" };
  }

  if (payment.status === MarketplacePaymentStatus.SUCCEEDED) {
    return { ok: true as const, duplicate: true, jobId: payment.jobId };
  }

  let autoSplit = Boolean(opts.autoSplit);
  let applicationFee = opts.applicationFee;
  let traderNet = opts.traderNet;
  let feeLedgerId = opts.feeLedgerId ?? payment.quote.feeLedger?.id;

  // Detect auto-split from PaymentIntent metadata if webhook didn't pass it
  if (!autoSplit && isStripeConfigured()) {
    try {
      const stripe = getStripe();
      const pi = await stripe.paymentIntents.retrieve(opts.paymentIntentId);
      if (pi.metadata?.buildproAutoSplit === "1") {
        autoSplit = true;
        feeLedgerId = feeLedgerId ?? pi.metadata.buildproFeeLedgerId;
        applicationFee = applicationFee ?? Number(pi.metadata.buildproApplicationFee || 0);
        traderNet = traderNet ?? Number(pi.metadata.buildproTraderNet || 0);
      }
    } catch (err) {
      console.warn("[PAY_SUCCEEDED] PI retrieve failed", err);
    }
  }

  if (autoSplit && (applicationFee == null || traderNet == null)) {
    const config = await getPricingConfig();
    const split = buildConnectSplit(payment.quote.amount, config);
    applicationFee = applicationFee ?? split.applicationFee;
    traderNet = traderNet ?? split.traderNet;
  }

  await prisma.$transaction(async (tx) => {
    await tx.marketplacePayment.update({
      where: { id: payment.id },
      data: { status: MarketplacePaymentStatus.SUCCEEDED },
    });

    if (
      payment.job.status === MarketplaceJobStatus.AWAITING_PAYMENT ||
      payment.job.status === MarketplaceJobStatus.AWARDED ||
      payment.job.status === MarketplaceJobStatus.OPEN ||
      payment.job.status === MarketplaceJobStatus.QUOTES_RECEIVED
    ) {
      await tx.marketplaceJob.update({
        where: { id: payment.jobId },
        data: { status: MarketplaceJobStatus.FUNDED },
      });
    }

    if (autoSplit && traderNet != null && traderNet > 0) {
      const existingPayout = await tx.payout.findFirst({
        where: { jobId: payment.jobId },
      });
      if (!existingPayout) {
        await tx.payout.create({
          data: {
            traderId: payment.quote.traderId,
            jobId: payment.jobId,
            netAmount: traderNet,
            stripeTransferId: `dest_${opts.paymentIntentId}`,
            status: PayoutTransferStatus.SUCCEEDED,
          },
        });
      }
    }

    await tx.auditLog.create({
      data: {
        entity: "marketplace_payment",
        entityId: payment.id,
        action: autoSplit ? "payment_succeeded_autosplit" : "payment_succeeded",
        after: {
          paymentIntentId: opts.paymentIntentId,
          jobId: payment.jobId,
          customerTotal: payment.customerTotal,
          protectionOptedIn: payment.protectionOptedIn,
          autoSplit,
          applicationFee: applicationFee ?? null,
          traderNet: traderNet ?? null,
          eventId: opts.eventId ?? null,
        },
      },
    });
  });

  if (autoSplit && feeLedgerId) {
    await markCommissionPaid({
      feeLedgerId,
      paymentIntentId: opts.paymentIntentId,
    });
  }

  const amount = formatMoney(payment.customerTotal);
  const traderMsg = autoSplit
    ? `Payment received for “${payment.job.title}”. ${formatMoney(traderNet ?? 0)} is on your Connect account (platform kept ${formatMoney(applicationFee ?? 0)}).`
    : `Payment received for “${payment.job.title}”. Funds are held on HomeCreww until release rules apply.`;

  void notifyUserWithEmail({
    userId: payment.quote.traderId,
    title: "Job funded — you can start",
    message: traderMsg,
    type: "SUCCESS",
    link: `/construction/jobs/${payment.jobId}`,
    emailKey: "marketplace_payment_success",
    emailVars: { jobTitle: payment.job.title, amount },
  });

  void notifyUserWithEmail({
    userId: payment.job.clientId,
    title: "Payment successful",
    message: `Your payment for “${payment.job.title}” is confirmed. The trader has been notified.`,
    type: "SUCCESS",
    link: `/customer/jobs/${payment.jobId}`,
    emailKey: "marketplace_payment_success",
    emailVars: { jobTitle: payment.job.title, amount },
  });

  return { ok: true as const, jobId: payment.jobId, autoSplit };
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

  const quote = await prisma.quote.findUnique({
    where: { id: payment.quoteId },
    include: {
      trader: {
        select: {
          stripeAccountId: true,
          stripeOnboardingDone: true,
          stripePayoutsEnabled: true,
        },
      },
      feeLedger: true,
    },
  });
  if (!quote?.trader.stripeAccountId) {
    throw new Error(
      "Trader must complete Stripe Connect before payment can be taken."
    );
  }
  if (!quote.trader.stripeOnboardingDone || !quote.trader.stripePayoutsEnabled) {
    throw new Error("Trader Connect account is not payout-eligible yet.");
  }

  const config = await getPricingConfig();
  const split = buildConnectSplit(quote.amount, config);
  const stripe = getStripe();

  if (payment.stripePaymentIntentId) {
    const existing = await stripe.paymentIntents.retrieve(payment.stripePaymentIntentId);
    if (existing.status === "succeeded") {
      await markMarketplacePaymentSucceeded({
        paymentIntentId: existing.id,
        autoSplit: existing.metadata?.buildproAutoSplit === "1",
      });
      throw new Error("Already paid.");
    }
    if (
      existing.metadata?.buildproAutoSplit === "1" &&
      existing.amount === split.chargePence &&
      (existing.status === "requires_payment_method" ||
        existing.status === "requires_confirmation" ||
        existing.status === "requires_action")
    ) {
      return {
        clientSecret: existing.client_secret!,
        paymentIntentId: existing.id,
        amount: split.charge,
        split,
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
      amount: split.chargePence,
      currency: STRIPE_CURRENCY,
      customer: customerId,
      automatic_payment_methods: { enabled: true },
      application_fee_amount: split.applicationFeePence,
      transfer_data: {
        destination: quote.trader.stripeAccountId,
      },
      metadata: {
        buildproKind: "homeowner_checkout",
        buildproAutoSplit: "1",
        buildproPaymentId: payment.id,
        buildproJobId: payment.jobId,
        buildproQuoteId: payment.quoteId,
        buildproFeeLedgerId: quote.feeLedger?.id ?? "",
        buildproApplicationFee: String(split.applicationFee),
        buildproTraderNet: String(split.traderNet),
        buildproCommissionRate: String(split.rate),
        protectionOptedIn: String(payment.protectionOptedIn),
        termsVersion: payment.termsVersion,
      },
      description: `HomeCreww job: ${payment.job.title} · ${split.label}`,
    },
    {
      idempotencyKey: `mpay_split_${payment.id}_${split.chargePence}_${split.applicationFeePence}`,
    }
  );

  await prisma.marketplacePayment.update({
    where: { id: payment.id },
    data: {
      stripePaymentIntentId: intent.id,
      customerTotal: split.charge,
      status: MarketplacePaymentStatus.REQUIRES_ACTION,
    },
  });

  await prisma.auditLog.create({
    data: {
      entity: "marketplace_payment",
      entityId: payment.id,
      action: "payment_intent_created_autosplit",
      actorId: clientUserId,
      after: {
        paymentIntentId: intent.id,
        amount: split.charge,
        applicationFee: split.applicationFee,
        traderNet: split.traderNet,
        destination: quote.trader.stripeAccountId,
      },
    },
  });

  return {
    clientSecret: intent.client_secret!,
    paymentIntentId: intent.id,
    amount: split.charge,
    split,
  };
}
