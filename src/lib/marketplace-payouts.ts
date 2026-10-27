import prisma from "@/lib/prisma";
import {
  FeeLedgerStatus,
  MarketplaceJobStatus,
  MarketplacePaymentStatus,
  ProtectionStatus,
  UnprotectedReleaseTiming,
} from "@/generated/prisma";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { toStripeAmount } from "@/lib/marketplace-payments";
import { getPricingConfig } from "@/lib/pricing";
import { createNotification } from "@/lib/notifications";

export type ReleaseResult =
  | { ok: true; payoutId: string; netAmount: number; transferId: string | null; simulated: boolean }
  | { ok: false; reason: string };

/**
 * Transfer quote − success fee to trader Connect account.
 * Marks fee_ledger COLLECTED and job PAID_OUT. Idempotent per job.
 */
export async function releaseJobPayout(jobId: string, actorId?: string): Promise<ReleaseResult> {
  const job = await prisma.marketplaceJob.findUnique({
    where: { id: jobId },
    include: {
      payments: {
        where: { status: MarketplacePaymentStatus.SUCCEEDED },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      payouts: true,
    },
  });

  if (!job) return { ok: false, reason: "Job not found." };
  if (job.status === MarketplaceJobStatus.PAID_OUT || job.payouts.length > 0) {
    return {
      ok: true,
      payoutId: job.payouts[0]?.id ?? "existing",
      netAmount: job.payouts[0]?.netAmount ?? 0,
      transferId: job.payouts[0]?.stripeTransferId ?? null,
      simulated: false,
    };
  }

  if (job.status === MarketplaceJobStatus.DISPUTED) {
    return { ok: false, reason: "Job is disputed — payout held." };
  }

  if (job.status === MarketplaceJobStatus.CANCELLED) {
    return { ok: false, reason: "Job cancelled." };
  }

  if (!job.acceptedQuoteId) {
    return { ok: false, reason: "No accepted quote." };
  }

  const payment = job.payments[0];
  if (!payment) {
    return { ok: false, reason: "No successful payment to release." };
  }

  const quote = await prisma.quote.findUnique({ where: { id: job.acceptedQuoteId } });
  if (!quote) return { ok: false, reason: "Accepted quote missing." };

  const fee = await prisma.feeLedger.findUnique({ where: { quoteId: quote.id } });
  const feeAmount = fee?.status === FeeLedgerStatus.VOIDED ? 0 : (fee?.amount ?? 0);
  const netAmount = Math.max(0, Math.round((quote.amount - feeAmount) * 100) / 100);

  const trader = await prisma.user.findUnique({
    where: { id: quote.traderId },
    select: { id: true, stripeAccountId: true, name: true },
  });
  if (!trader?.stripeAccountId) {
    return { ok: false, reason: "Trader has no Stripe Connect account." };
  }

  let transferId: string | null = null;
  let simulated = false;

  if (isStripeConfigured() && netAmount > 0) {
    try {
      const stripe = getStripe();
      const transfer = await stripe.transfers.create(
        {
          amount: toStripeAmount(netAmount),
          currency: "inr",
          destination: trader.stripeAccountId,
          transfer_group: jobId,
          metadata: {
            buildproJobId: jobId,
            buildproQuoteId: quote.id,
            traderFee: String(feeAmount),
            protectionStatus: job.protectionStatus,
          },
        },
        { idempotencyKey: `payout_transfer_${jobId}` }
      );
      transferId = transfer.id;
    } catch (err) {
      console.error("[PAYOUT_TRANSFER]", err);
      return {
        ok: false,
        reason: err instanceof Error ? err.message : "Stripe transfer failed.",
      };
    }
  } else if (!isStripeConfigured()) {
    // Dev/demo without Stripe keys — record simulated payout
    simulated = true;
    transferId = `sim_tr_${jobId}`;
  }

  const payout = await prisma.$transaction(async (tx) => {
    if (fee && fee.status === FeeLedgerStatus.PENDING) {
      await tx.feeLedger.update({
        where: { id: fee.id },
        data: { status: FeeLedgerStatus.COLLECTED },
      });
    }

    const created = await tx.payout.create({
      data: {
        traderId: quote.traderId,
        jobId,
        netAmount,
        stripeTransferId: transferId,
      },
    });

    await tx.marketplaceJob.update({
      where: { id: jobId },
      data: {
        status: MarketplaceJobStatus.PAID_OUT,
        confirmedAt: job.confirmedAt ?? new Date(),
      },
    });

    await tx.auditLog.create({
      data: {
        entity: "marketplace_job",
        entityId: jobId,
        action: "payout_released",
        actorId: actorId ?? null,
        after: {
          netAmount,
          feeAmount,
          transferId,
          simulated,
        },
      },
    });

    return created;
  });

  void createNotification({
    userId: quote.traderId,
    title: "Payout released",
    message: `₹${netAmount.toLocaleString("en-IN")} transferred for “${job.title}” (after success fee).`,
    type: "SUCCESS",
    link: "/construction/payouts",
  });

  void createNotification({
    userId: job.clientId,
    title: "Job paid out",
    message: `“${job.title}” is complete and the trader has been paid.`,
    type: "INFO",
    link: `/customer/jobs/${jobId}`,
  });

  return {
    ok: true,
    payoutId: payout.id,
    netAmount,
    transferId,
    simulated,
  };
}

/** Void pending success fee when cancelled before work starts. */
export async function voidFeeIfPending(quoteId: string, actorId?: string) {
  const fee = await prisma.feeLedger.findUnique({ where: { quoteId } });
  if (!fee || fee.status !== FeeLedgerStatus.PENDING) return null;

  const updated = await prisma.feeLedger.update({
    where: { id: fee.id },
    data: { status: FeeLedgerStatus.VOIDED },
  });

  await prisma.auditLog.create({
    data: {
      entity: "fee_ledger",
      entityId: fee.id,
      action: "voided",
      actorId: actorId ?? null,
      after: { quoteId, amount: fee.amount },
    },
  });

  return updated;
}

/** Should unprotected jobs release at start? */
export async function unprotectedReleasesAtStart() {
  const config = await getPricingConfig();
  return config.unprotectedReleaseAt === UnprotectedReleaseTiming.JOB_START;
}

/**
 * Auto-confirm COMPLETED jobs after autoConfirmDays with no customer response.
 */
export async function processAutoConfirms(limit = 20) {
  const config = await getPricingConfig();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - config.autoConfirmDays);

  const jobs = await prisma.marketplaceJob.findMany({
    where: {
      status: MarketplaceJobStatus.COMPLETED,
      completedAt: { lte: cutoff },
      confirmedAt: null,
      protectionStatus: { not: ProtectionStatus.UNDECIDED },
    },
    take: limit,
  });

  const results: { jobId: string; released: boolean }[] = [];
  const releaseUnprotectedAtStart = await unprotectedReleasesAtStart();

  for (const job of jobs) {
    await prisma.marketplaceJob.update({
      where: { id: job.id },
      data: { confirmedAt: new Date() },
    });

    const existingPayout = await prisma.payout.findFirst({ where: { jobId: job.id } });
    if (existingPayout) {
      await prisma.marketplaceJob.update({
        where: { id: job.id },
        data: { status: MarketplaceJobStatus.PAID_OUT },
      });
      results.push({ jobId: job.id, released: false });
      continue;
    }

    const needsReleaseNow =
      job.protectionStatus === ProtectionStatus.PROTECTED ||
      (job.protectionStatus === ProtectionStatus.UNPROTECTED && !releaseUnprotectedAtStart);

    if (needsReleaseNow) {
      const release = await releaseJobPayout(job.id, "system:auto-confirm");
      results.push({ jobId: job.id, released: release.ok });
    } else {
      await prisma.marketplaceJob.update({
        where: { id: job.id },
        data: { status: MarketplaceJobStatus.PAID_OUT },
      });
      results.push({ jobId: job.id, released: false });
    }
  }

  return results;
}
