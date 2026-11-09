"use server";

import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import {
  UserRole,
  MarketplaceJobStatus,
  MarketplacePaymentStatus,
  ProtectionStatus,
  QuoteStatus,
  FeeLedgerStatus,
} from "@/generated/prisma";
import { revalidatePath } from "next/cache";
import { notifyUserWithEmail } from "@/lib/marketplace-notify";
import {
  releaseJobPayout,
  voidFeeIfPending,
  unprotectedReleasesAtStart,
  processAutoConfirms,
} from "@/lib/marketplace-payouts";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

async function loadJobForTrader(jobId: string, traderId: string) {
  const job = await prisma.marketplaceJob.findUnique({
    where: { id: jobId },
    include: {
      quotes: {
        where: { traderId, status: QuoteStatus.ACCEPTED },
        take: 1,
      },
    },
  });
  if (!job || job.quotes.length === 0) return null;
  return job;
}

export async function startJobAction(jobId: string) {
  const session = await requireAuth([UserRole.CONTRACTOR]);
  const traderId = session.user.id!;

  const job = await loadJobForTrader(jobId, traderId);
  if (!job) return { success: false as const, message: "Job not found." };

  const canStartFromEscrow = job.status === MarketplaceJobStatus.FUNDED;
  const canStartFromAward =
    job.status === MarketplaceJobStatus.AWARDED &&
    (await prisma.feeLedger.findFirst({
      where: {
        quoteId: job.acceptedQuoteId ?? undefined,
        traderId,
        status: FeeLedgerStatus.COLLECTED,
      },
    }));

  if (!canStartFromEscrow && !canStartFromAward) {
    return {
      success: false as const,
      message:
        job.status === MarketplaceJobStatus.AWARDED
          ? "Pay platform commission before starting work."
          : "Job is not ready to start yet.",
    };
  }

  await prisma.marketplaceJob.update({
    where: { id: jobId },
    data: {
      status: MarketplaceJobStatus.IN_PROGRESS,
      startDate: job.startDate ?? new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      entity: "marketplace_job",
      entityId: jobId,
      action: "started",
      actorId: traderId,
    },
  });

  let payoutNote: string | undefined;
  if (
    canStartFromEscrow &&
    job.protectionStatus === ProtectionStatus.UNPROTECTED &&
    (await unprotectedReleasesAtStart())
  ) {
    const release = await releaseJobPayout(jobId, traderId);
    payoutNote = release.ok
      ? `Unprotected payout released: £${release.netAmount.toLocaleString("en-GB")}`
      : `Payout pending: ${release.reason}`;
  }

  void notifyUserWithEmail({
    userId: job.clientId,
    title: "Work started",
    message: `The trader started work on “${job.title}”.`,
    type: "INFO",
    link: `/customer/jobs/${jobId}`,
    emailKey: "marketplace_job_started",
    emailVars: { jobTitle: job.title },
  });

  revalidatePath(`/customer/jobs/${jobId}`);
  revalidatePath(`/construction/jobs/${jobId}`);
  revalidatePath("/construction/jobs");

  return {
    success: true as const,
    message: payoutNote ?? "Job marked as in progress.",
  };
}

export async function completeJobAction(jobId: string) {
  const session = await requireAuth([UserRole.CONTRACTOR]);
  const traderId = session.user.id!;

  const job = await loadJobForTrader(jobId, traderId);
  if (!job) return { success: false as const, message: "Job not found." };

  if (
    job.status !== MarketplaceJobStatus.IN_PROGRESS &&
    job.status !== MarketplaceJobStatus.FUNDED
  ) {
    return { success: false as const, message: "Job cannot be completed from this status." };
  }

  await prisma.marketplaceJob.update({
    where: { id: jobId },
    data: {
      status: MarketplaceJobStatus.COMPLETED,
      completedAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      entity: "marketplace_job",
      entityId: jobId,
      action: "completed_by_trader",
      actorId: traderId,
    },
  });

  void notifyUserWithEmail({
    userId: job.clientId,
    title: "Work marked complete",
    message: `Please confirm “${job.title}” is finished.`,
    type: "SUCCESS",
    link: `/customer/jobs/${jobId}`,
    emailKey: "marketplace_job_completed",
    emailVars: { jobTitle: job.title },
  });

  revalidatePath(`/customer/jobs/${jobId}`);
  revalidatePath(`/construction/jobs/${jobId}`);

  return { success: true as const, message: "Marked complete. Waiting for customer confirmation." };
}

export async function confirmJobAction(jobId: string) {
  const session = await requireAuth([UserRole.CLIENT]);
  const clientId = session.user.id!;

  const job = await prisma.marketplaceJob.findUnique({ where: { id: jobId } });
  if (!job || job.clientId !== clientId) {
    return { success: false as const, message: "Job not found." };
  }

  if (job.status === MarketplaceJobStatus.DISPUTED) {
    return { success: false as const, message: "Job is under dispute." };
  }

  if (job.status === MarketplaceJobStatus.PAID_OUT) {
    return { success: true as const, message: "Already paid out." };
  }

  if (
    job.status !== MarketplaceJobStatus.COMPLETED &&
    job.status !== MarketplaceJobStatus.IN_PROGRESS &&
    job.status !== MarketplaceJobStatus.FUNDED
  ) {
    return { success: false as const, message: "Nothing to confirm yet." };
  }

  await prisma.marketplaceJob.update({
    where: { id: jobId },
    data: {
      confirmedAt: new Date(),
      status:
        job.status === MarketplaceJobStatus.COMPLETED ||
        job.status === MarketplaceJobStatus.IN_PROGRESS
          ? MarketplaceJobStatus.COMPLETED
          : job.status,
      completedAt: job.completedAt ?? new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      entity: "marketplace_job",
      entityId: jobId,
      action: "confirmed_by_customer",
      actorId: clientId,
    },
  });

  // Award path: customer paid trader off-platform — just close the job.
  const hasEscrowPayment = await prisma.marketplacePayment.findFirst({
    where: { jobId, status: MarketplacePaymentStatus.SUCCEEDED },
  });

  let message = "Job confirmed.";

  if (!hasEscrowPayment) {
    await prisma.marketplaceJob.update({
      where: { id: jobId },
      data: { status: MarketplaceJobStatus.PAID_OUT },
    });
    message = "Confirmed. Thanks — job closed.";
  } else {
    // Legacy escrow: Protected always release on confirm; unprotected may already be paid.
    const alreadyPaid = await prisma.payout.findFirst({ where: { jobId } });

    if (!alreadyPaid) {
      const releaseAtStart =
        job.protectionStatus === ProtectionStatus.UNPROTECTED &&
        (await unprotectedReleasesAtStart());

      if (job.protectionStatus === ProtectionStatus.PROTECTED || !releaseAtStart) {
        const release = await releaseJobPayout(jobId, clientId);
        message = release.ok
          ? `Confirmed. Trader paid £${release.netAmount.toLocaleString("en-GB")}.`
          : `Confirmed, but payout failed: ${release.reason}`;
      } else {
        await prisma.marketplaceJob.update({
          where: { id: jobId },
          data: { status: MarketplaceJobStatus.PAID_OUT },
        });
        message = "Confirmed. (Unprotected payout was released at start.)";
      }
    } else {
      await prisma.marketplaceJob.update({
        where: { id: jobId },
        data: { status: MarketplaceJobStatus.PAID_OUT },
      });
    }
  }

  revalidatePath(`/customer/jobs/${jobId}`);
  revalidatePath(`/construction/jobs/${jobId}`);

  return { success: true as const, message };
}

/** Cancel after accept/funding but before work — void fee + optional Stripe refund. */
export async function cancelFundedJobAction(jobId: string) {
  const session = await requireAuth([UserRole.CLIENT]);
  const clientId = session.user.id!;

  const job = await prisma.marketplaceJob.findUnique({
    where: { id: jobId },
    include: {
      payments: {
        where: { status: MarketplacePaymentStatus.SUCCEEDED },
        take: 1,
      },
    },
  });

  if (!job || job.clientId !== clientId) {
    return { success: false as const, message: "Job not found." };
  }

  if (
    job.status !== MarketplaceJobStatus.AWAITING_PAYMENT &&
    job.status !== MarketplaceJobStatus.FUNDED &&
    job.status !== MarketplaceJobStatus.AWARDED
  ) {
    return {
      success: false as const,
      message: "Can only cancel before work starts.",
    };
  }

  if (job.acceptedQuoteId) {
    await voidFeeIfPending(job.acceptedQuoteId, clientId);
  }

  // Refund succeeded payment if any
  const payment = job.payments[0];
  if (payment?.stripePaymentIntentId && isStripeConfigured()) {
    try {
      const stripe = getStripe();
      await stripe.refunds.create(
        { payment_intent: payment.stripePaymentIntentId },
        { idempotencyKey: `refund_cancel_${payment.id}` }
      );
      await prisma.marketplacePayment.update({
        where: { id: payment.id },
        data: { status: MarketplacePaymentStatus.REFUNDED },
      });
    } catch (err) {
      console.error("[CANCEL_REFUND]", err);
      return {
        success: false as const,
        message: err instanceof Error ? err.message : "Refund failed.",
      };
    }
  }

  await prisma.marketplaceJob.update({
    where: { id: jobId },
    data: { status: MarketplaceJobStatus.CANCELLED },
  });

  await prisma.auditLog.create({
    data: {
      entity: "marketplace_job",
      entityId: jobId,
      action: "cancelled_pre_start",
      actorId: clientId,
    },
  });

  revalidatePath(`/customer/jobs/${jobId}`);
  revalidatePath("/customer/jobs");

  return { success: true as const, message: "Job cancelled. Fee voided; refund processed if paid." };
}

export async function runAutoConfirmAction() {
  await requireAuth([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
  const results = await processAutoConfirms();
  return { success: true as const, count: results.length, results };
}
