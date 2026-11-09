import prisma from "@/lib/prisma";
import {
  SubscriptionStatus,
  FeeLedgerStatus,
  PlatformInvoiceKind,
  PlatformInvoiceStatus,
  type PricingConfig,
} from "@/generated/prisma";
import { roundMoney } from "@/lib/pricing";
import { formatMoney } from "@/lib/money";

export async function getActiveSubscription(traderId: string) {
  const now = new Date();
  return prisma.traderSubscription.findFirst({
    where: {
      traderId,
      status: SubscriptionStatus.ACTIVE,
      endsAt: { gt: now },
    },
    orderBy: { endsAt: "desc" },
  });
}

export async function getTraderQuoteAccess(traderId: string) {
  const [user, sub] = await Promise.all([
    prisma.user.findUnique({
      where: { id: traderId },
      select: { quoteCredits: true },
    }),
    getActiveSubscription(traderId),
  ]);

  const credits = user?.quoteCredits ?? 0;
  const subscribed = Boolean(sub);
  return {
    credits,
    subscribed,
    subscriptionEndsAt: sub?.endsAt ?? null,
    canQuote: subscribed || credits > 0,
  };
}

/** Consume 1 credit unless subscribed. Returns false if blocked. */
export async function consumeQuoteCreditOrPass(traderId: string) {
  const access = await getTraderQuoteAccess(traderId);
  if (access.subscribed) {
    return { ok: true as const, via: "subscription" as const };
  }
  if (access.credits < 1) {
    return { ok: false as const, reason: "No quote credits. Buy a pack or subscribe." };
  }

  const updated = await prisma.user.updateMany({
    where: { id: traderId, quoteCredits: { gte: 1 } },
    data: { quoteCredits: { decrement: 1 } },
  });
  if (updated.count === 0) {
    return { ok: false as const, reason: "No quote credits. Buy a pack or subscribe." };
  }
  return { ok: true as const, via: "credit" as const };
}

export function calcCommission(
  quoteAmount: number,
  config: Pick<PricingConfig, "commissionRate" | "commissionMin" | "commissionMax">
) {
  const amount = Math.max(0, Number(quoteAmount) || 0);
  let fee = amount * (config.commissionRate ?? 0.08);
  if (config.commissionMin != null) fee = Math.max(fee, config.commissionMin);
  if (config.commissionMax != null && config.commissionMax > 0) {
    fee = Math.min(fee, config.commissionMax);
  }
  return roundMoney(fee);
}

export async function nextPlatformInvoiceNo() {
  const n = await prisma.platformInvoice.count();
  const seq = String(n + 1).padStart(5, "0");
  return `BP-${new Date().getFullYear()}-${seq}`;
}

export async function createCommissionInvoice(opts: {
  traderId: string;
  quoteId: string;
  jobId: string;
  jobTitle: string;
  feeLedgerId: string;
  amount: number;
  rate: number;
}) {
  const invoiceNo = await nextPlatformInvoiceNo();
  return prisma.platformInvoice.create({
    data: {
      invoiceNo,
      traderId: opts.traderId,
      kind: PlatformInvoiceKind.COMMISSION,
      status: PlatformInvoiceStatus.SENT,
      amount: opts.amount,
      description: `Platform commission (${(opts.rate * 100).toFixed(0)}%) — ${opts.jobTitle}`,
      quoteId: opts.quoteId,
      jobId: opts.jobId,
      feeLedgerId: opts.feeLedgerId,
    },
  });
}

export async function markCommissionPaid(opts: {
  feeLedgerId: string;
  paymentIntentId?: string;
}) {
  const fee = await prisma.feeLedger.findUnique({
    where: { id: opts.feeLedgerId },
  });
  if (!fee) return null;
  if (fee.status === FeeLedgerStatus.COLLECTED) return fee;

  const updated = await prisma.feeLedger.update({
    where: { id: fee.id },
    data: {
      status: FeeLedgerStatus.COLLECTED,
      stripePaymentIntentId: opts.paymentIntentId ?? fee.stripePaymentIntentId,
    },
  });

  await prisma.platformInvoice.updateMany({
    where: { feeLedgerId: fee.id, status: { not: PlatformInvoiceStatus.PAID } },
    data: { status: PlatformInvoiceStatus.PAID, paidAt: new Date() },
  });

  return updated;
}

export function commissionLabel(amount: number, rate: number) {
  return `${formatMoney(amount)} (${(rate * 100).toFixed(0)}% commission)`;
}
