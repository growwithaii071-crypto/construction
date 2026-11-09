"use server";

import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import {
  UserRole,
  CreditPurchaseStatus,
  SubscriptionStatus,
  FeeLedgerStatus,
  PlatformInvoiceKind,
  PlatformInvoiceStatus,
} from "@/generated/prisma";
import { revalidatePath } from "next/cache";
import { getPricingConfig } from "@/lib/pricing";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import {
  toStripeAmount,
  STRIPE_CURRENCY,
  formatMoney,
} from "@/lib/money";
import {
  getTraderQuoteAccess,
  nextPlatformInvoiceNo,
  markCommissionPaid,
} from "@/lib/trader-billing";
import { getAppUrl } from "@/lib/app-url";

async function requireContractor() {
  return requireAuth([UserRole.CONTRACTOR]);
}

async function ensureStripeCustomer(userId: string, email: string, name?: string | null) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });
  if (user?.stripeCustomerId) return user.stripeCustomerId;

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email,
    name: name ?? undefined,
    metadata: { buildproUserId: userId },
  });
  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });
  return customer.id;
}

export async function getBillingStatusAction() {
  const session = await requireContractor();
  const traderId = session.user.id!;
  const [access, config, invoices] = await Promise.all([
    getTraderQuoteAccess(traderId),
    getPricingConfig(),
    prisma.platformInvoice.findMany({
      where: { traderId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return {
    success: true as const,
    access,
    packs: {
      price: config.creditPackPrice,
      size: config.creditPackSize,
    },
    subscription: {
      price: config.subscriptionPrice,
      days: config.subscriptionDays,
    },
    commissionRate: config.commissionRate,
    invoices,
  };
}

/** Create Stripe PaymentIntent to buy a credit pack. */
export async function buyCreditPackAction() {
  const session = await requireContractor();
  const traderId = session.user.id!;

  if (!isStripeConfigured()) {
    return { success: false as const, message: "Stripe is not configured." };
  }

  const config = await getPricingConfig();
  const amount = config.creditPackPrice;
  const credits = config.creditPackSize;

  const purchase = await prisma.creditPurchase.create({
    data: {
      traderId,
      credits,
      amount,
      status: CreditPurchaseStatus.PENDING,
    },
  });

  const customerId = await ensureStripeCustomer(
    traderId,
    session.user.email!,
    session.user.name
  );
  const stripe = getStripe();
  const intent = await stripe.paymentIntents.create(
    {
      amount: toStripeAmount(amount),
      currency: STRIPE_CURRENCY,
      customer: customerId,
      automatic_payment_methods: { enabled: true },
      metadata: {
        buildproKind: "credits",
        buildproPurchaseId: purchase.id,
        buildproTraderId: traderId,
        credits: String(credits),
      },
      description: `BuildPro quote credits ×${credits}`,
    },
    { idempotencyKey: `credits_${purchase.id}` }
  );

  await prisma.creditPurchase.update({
    where: { id: purchase.id },
    data: { stripePaymentIntentId: intent.id },
  });

  return {
    success: true as const,
    clientSecret: intent.client_secret!,
    purchaseId: purchase.id,
    amount,
    credits,
  };
}

export async function buySubscriptionAction() {
  const session = await requireContractor();
  const traderId = session.user.id!;

  if (!isStripeConfigured()) {
    return { success: false as const, message: "Stripe is not configured." };
  }

  const access = await getTraderQuoteAccess(traderId);
  if (access.subscribed) {
    return { success: false as const, message: "You already have an active subscription." };
  }

  const config = await getPricingConfig();
  const amount = config.subscriptionPrice;
  const days = config.subscriptionDays;
  const endsAt = new Date();
  endsAt.setDate(endsAt.getDate() + days);

  const sub = await prisma.traderSubscription.create({
    data: {
      traderId,
      status: SubscriptionStatus.ACTIVE,
      price: amount,
      endsAt,
      // stays ACTIVE only after payment succeeds — temporarily mark then fix via webhook
    },
  });

  // Hold as expired until paid — use endsAt in past until webhook? Better: create pending via status.
  // Schema only has ACTIVE/CANCELLED/EXPIRED. Create with endsAt now, webhook extends.
  await prisma.traderSubscription.update({
    where: { id: sub.id },
    data: { status: SubscriptionStatus.EXPIRED, endsAt: new Date() },
  });

  const customerId = await ensureStripeCustomer(
    traderId,
    session.user.email!,
    session.user.name
  );
  const stripe = getStripe();
  const intent = await stripe.paymentIntents.create(
    {
      amount: toStripeAmount(amount),
      currency: STRIPE_CURRENCY,
      customer: customerId,
      automatic_payment_methods: { enabled: true },
      metadata: {
        buildproKind: "subscription",
        buildproSubscriptionId: sub.id,
        buildproTraderId: traderId,
        days: String(days),
      },
      description: `BuildPro trader subscription (${days} days)`,
    },
    { idempotencyKey: `sub_${sub.id}` }
  );

  await prisma.traderSubscription.update({
    where: { id: sub.id },
    data: { stripePaymentIntentId: intent.id },
  });

  return {
    success: true as const,
    clientSecret: intent.client_secret!,
    subscriptionId: sub.id,
    amount,
    days,
  };
}

/** Start commission PaymentIntent for an awarded job. */
export async function payCommissionAction(jobId: string) {
  const session = await requireContractor();
  const traderId = session.user.id!;

  if (!isStripeConfigured()) {
    return { success: false as const, message: "Stripe is not configured." };
  }

  const job = await prisma.marketplaceJob.findUnique({
    where: { id: jobId },
    include: {
      quotes: {
        where: { traderId, status: "ACCEPTED" },
        include: { feeLedger: true },
        take: 1,
      },
    },
  });

  if (!job || job.quotes.length === 0) {
    return { success: false as const, message: "Awarded job not found." };
  }

  const quote = job.quotes[0]!;
  const fee = quote.feeLedger;
  if (!fee) {
    return { success: false as const, message: "Commission record missing." };
  }
  if (fee.status === FeeLedgerStatus.COLLECTED) {
    return { success: false as const, message: "Commission already paid." };
  }

  if (fee.stripePaymentIntentId) {
    const stripe = getStripe();
    const existing = await stripe.paymentIntents.retrieve(fee.stripePaymentIntentId);
    if (existing.client_secret && existing.status !== "succeeded") {
      return {
        success: true as const,
        clientSecret: existing.client_secret,
        amount: fee.amount,
        feeLedgerId: fee.id,
      };
    }
  }

  const customerId = await ensureStripeCustomer(
    traderId,
    session.user.email!,
    session.user.name
  );
  const stripe = getStripe();
  const intent = await stripe.paymentIntents.create(
    {
      amount: toStripeAmount(fee.amount),
      currency: STRIPE_CURRENCY,
      customer: customerId,
      automatic_payment_methods: { enabled: true },
      metadata: {
        buildproKind: "commission",
        buildproFeeLedgerId: fee.id,
        buildproJobId: jobId,
        buildproQuoteId: quote.id,
        buildproTraderId: traderId,
      },
      description: `BuildPro commission — ${job.title}`,
    },
    { idempotencyKey: `commission_${fee.id}` }
  );

  await prisma.feeLedger.update({
    where: { id: fee.id },
    data: { stripePaymentIntentId: intent.id },
  });

  return {
    success: true as const,
    clientSecret: intent.client_secret!,
    amount: fee.amount,
    feeLedgerId: fee.id,
  };
}

/** Apply successful credit purchase (webhook / confirm). */
export async function fulfillCreditPurchase(purchaseId: string, paymentIntentId?: string) {
  const purchase = await prisma.creditPurchase.findUnique({ where: { id: purchaseId } });
  if (!purchase) return;
  if (purchase.status === CreditPurchaseStatus.SUCCEEDED) return;

  await prisma.$transaction(async (tx) => {
    await tx.creditPurchase.update({
      where: { id: purchaseId },
      data: {
        status: CreditPurchaseStatus.SUCCEEDED,
        stripePaymentIntentId: paymentIntentId ?? purchase.stripePaymentIntentId,
      },
    });
    await tx.user.update({
      where: { id: purchase.traderId },
      data: { quoteCredits: { increment: purchase.credits } },
    });
  });

  const invoiceNo = await nextPlatformInvoiceNo();
  await prisma.platformInvoice.create({
    data: {
      invoiceNo,
      traderId: purchase.traderId,
      kind: PlatformInvoiceKind.CREDITS,
      status: PlatformInvoiceStatus.PAID,
      amount: purchase.amount,
      description: `Quote credits ×${purchase.credits}`,
      purchaseId: purchase.id,
      paidAt: new Date(),
    },
  });

  revalidatePath("/construction/billing");
}

export async function fulfillSubscription(subscriptionId: string, paymentIntentId?: string) {
  const config = await getPricingConfig();
  const sub = await prisma.traderSubscription.findUnique({ where: { id: subscriptionId } });
  if (!sub) return;

  const endsAt = new Date();
  endsAt.setDate(endsAt.getDate() + config.subscriptionDays);

  await prisma.traderSubscription.update({
    where: { id: subscriptionId },
    data: {
      status: SubscriptionStatus.ACTIVE,
      endsAt,
      startsAt: new Date(),
      stripePaymentIntentId: paymentIntentId ?? sub.stripePaymentIntentId,
    },
  });

  const invoiceNo = await nextPlatformInvoiceNo();
  await prisma.platformInvoice.create({
    data: {
      invoiceNo,
      traderId: sub.traderId,
      kind: PlatformInvoiceKind.SUBSCRIPTION,
      status: PlatformInvoiceStatus.PAID,
      amount: sub.price || config.subscriptionPrice,
      description: `Trader subscription (${config.subscriptionDays} days)`,
      subscriptionId: sub.id,
      paidAt: new Date(),
    },
  });

  revalidatePath("/construction/billing");
}

export async function fulfillCommission(feeLedgerId: string, paymentIntentId?: string) {
  await markCommissionPaid({ feeLedgerId, paymentIntentId });
  revalidatePath("/construction/billing");
  revalidatePath("/construction/jobs");
}

export async function confirmBillingPaymentAction(opts: {
  kind: "credits" | "subscription" | "commission";
  id: string;
}) {
  await requireContractor();
  if (opts.kind === "credits") await fulfillCreditPurchase(opts.id);
  if (opts.kind === "subscription") await fulfillSubscription(opts.id);
  if (opts.kind === "commission") await fulfillCommission(opts.id);
  return { success: true as const, message: "Payment recorded." };
}
