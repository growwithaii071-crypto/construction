"use server";

import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import {
  UserRole,
  MarketplaceJobStatus,
  MarketplacePaymentStatus,
  ProtectionStatus,
  DisputeStatus,
  FeeLedgerStatus,
} from "@/generated/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createNotification, notifyAdmins } from "@/lib/notifications";
import { releaseJobPayout, voidFeeIfPending } from "@/lib/marketplace-payouts";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { toStripeAmount } from "@/lib/marketplace-payments";

const ReasonSchema = z.object({
  jobId: z.string().min(1),
  reason: z.string().min(10, "Please describe the issue (at least 10 characters)").max(2000),
});

export async function raiseDisputeAction(formData: FormData) {
  const session = await requireAuth([UserRole.CLIENT]);
  const clientId = session.user.id!;

  const parsed = ReasonSchema.safeParse({
    jobId: formData.get("jobId"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return { success: false as const, message: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const job = await prisma.marketplaceJob.findUnique({ where: { id: parsed.data.jobId } });
  if (!job || job.clientId !== clientId) {
    return { success: false as const, message: "Job not found." };
  }

  if (job.protectionStatus !== ProtectionStatus.PROTECTED) {
    return {
      success: false as const,
      message: "Disputes are only for Protected jobs. Use Report a problem for unprotected jobs.",
    };
  }

  if (
    ![
      MarketplaceJobStatus.FUNDED,
      MarketplaceJobStatus.IN_PROGRESS,
      MarketplaceJobStatus.COMPLETED,
    ].includes(job.status as typeof MarketplaceJobStatus.FUNDED)
  ) {
    return { success: false as const, message: "Disputes can only be raised after the job is funded." };
  }

  if (job.status === MarketplaceJobStatus.DISPUTED) {
    return { success: false as const, message: "A dispute is already open for this job." };
  }

  if (job.status === MarketplaceJobStatus.PAID_OUT) {
    return { success: false as const, message: "Payout already released — contact support." };
  }

  const open = await prisma.dispute.findFirst({
    where: {
      jobId: job.id,
      status: { in: [DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW] },
    },
  });
  if (open) {
    return { success: false as const, message: "A dispute is already open." };
  }

  const dispute = await prisma.dispute.create({
    data: {
      jobId: job.id,
      raisedById: clientId,
      reason: parsed.data.reason,
      status: DisputeStatus.OPEN,
    },
  });

  await prisma.marketplaceJob.update({
    where: { id: job.id },
    data: { status: MarketplaceJobStatus.DISPUTED },
  });

  await prisma.auditLog.create({
    data: {
      entity: "dispute",
      entityId: dispute.id,
      action: "raised",
      actorId: clientId,
      after: { jobId: job.id, reason: parsed.data.reason },
    },
  });

  const quote = job.acceptedQuoteId
    ? await prisma.quote.findUnique({ where: { id: job.acceptedQuoteId } })
    : null;

  if (quote) {
    void createNotification({
      userId: quote.traderId,
      title: "Dispute opened (Protected job)",
      message: `Customer raised a dispute on “${job.title}”. Funds remain held until admin resolves.`,
      type: "WARNING",
      link: `/construction/jobs/${job.id}`,
    });
  }

  void notifyAdmins({
    title: "New marketplace dispute",
    message: `Protected job “${job.title}” is disputed.`,
    type: "WARNING",
    link: `/disputes/${dispute.id}`,
  });

  revalidatePath(`/customer/jobs/${job.id}`);
  revalidatePath("/disputes");

  return { success: true as const, disputeId: dispute.id, message: "Dispute opened. Funds remain held." };
}

/** Unprotected only — log issue, no refund guarantee, no DISPUTED state. */
export async function reportProblemAction(formData: FormData) {
  const session = await requireAuth([UserRole.CLIENT]);
  const clientId = session.user.id!;

  const parsed = ReasonSchema.safeParse({
    jobId: formData.get("jobId"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return { success: false as const, message: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const job = await prisma.marketplaceJob.findUnique({ where: { id: parsed.data.jobId } });
  if (!job || job.clientId !== clientId) {
    return { success: false as const, message: "Job not found." };
  }

  if (job.protectionStatus !== ProtectionStatus.UNPROTECTED) {
    return {
      success: false as const,
      message: "Use Raise dispute for Protected jobs.",
    };
  }

  await prisma.auditLog.create({
    data: {
      entity: "marketplace_job",
      entityId: job.id,
      action: "report_problem",
      actorId: clientId,
      after: {
        reason: parsed.data.reason,
        protectionStatus: job.protectionStatus,
        jobStatus: job.status,
        noRefundGuarantee: true,
      },
    },
  });

  void notifyAdmins({
    title: "Problem reported (Unprotected)",
    message: `Customer reported an issue on “${job.title}” — no refund guarantee.`,
    type: "INFO",
    link: `/disputes?tab=reports`,
  });

  const quote = job.acceptedQuoteId
    ? await prisma.quote.findUnique({ where: { id: job.acceptedQuoteId } })
    : null;
  if (quote) {
    void createNotification({
      userId: quote.traderId,
      title: "Customer reported a problem",
      message: `A problem was logged on unprotected job “${job.title}”. No automatic refund.`,
      type: "WARNING",
      link: `/construction/jobs/${job.id}`,
    });
  }

  revalidatePath(`/customer/jobs/${job.id}`);
  return {
    success: true as const,
    message: "Problem logged. Unprotected jobs have no refund guarantee — support may follow up.",
  };
}

const ResolveSchema = z.object({
  disputeId: z.string().min(1),
  resolution: z.enum(["FULL_RELEASE", "PARTIAL_RELEASE", "REFUNDED"]),
  notes: z.string().max(2000).optional(),
  /** Rupees to trader on partial (remainder refunded to customer) */
  traderAmount: z.coerce.number().min(0).optional(),
});

export async function resolveDisputeAction(formData: FormData) {
  const session = await requireAuth([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
  const adminId = session.user.id!;

  const parsed = ResolveSchema.safeParse({
    disputeId: formData.get("disputeId"),
    resolution: formData.get("resolution"),
    notes: formData.get("notes") || undefined,
    traderAmount: formData.get("traderAmount") || undefined,
  });
  if (!parsed.success) {
    return { success: false as const, message: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const dispute = await prisma.dispute.findUnique({
    where: { id: parsed.data.disputeId },
    include: { job: true },
  });
  if (!dispute) return { success: false as const, message: "Dispute not found." };

  if (
    ![DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW].includes(
      dispute.status as typeof DisputeStatus.OPEN
    )
  ) {
    return { success: false as const, message: "Dispute already resolved." };
  }

  const job = dispute.job;
  const quote = job.acceptedQuoteId
    ? await prisma.quote.findUnique({ where: { id: job.acceptedQuoteId } })
    : null;
  if (!quote) return { success: false as const, message: "Accepted quote missing." };

  const payment = await prisma.marketplacePayment.findFirst({
    where: { jobId: job.id, status: MarketplacePaymentStatus.SUCCEEDED },
    orderBy: { createdAt: "desc" },
  });

  await prisma.dispute.update({
    where: { id: dispute.id },
    data: { status: DisputeStatus.UNDER_REVIEW },
  });

  try {
    if (parsed.data.resolution === "FULL_RELEASE") {
      // Restore job out of DISPUTED so payout can proceed
      await prisma.marketplaceJob.update({
        where: { id: job.id },
        data: {
          status: MarketplaceJobStatus.COMPLETED,
          completedAt: job.completedAt ?? new Date(),
          confirmedAt: new Date(),
        },
      });
      const release = await releaseJobPayout(job.id, adminId);
      if (!release.ok) {
        return { success: false as const, message: release.reason };
      }
      await prisma.dispute.update({
        where: { id: dispute.id },
        data: {
          status: DisputeStatus.FULL_RELEASE,
          resolution: parsed.data.notes || "Full release to trader",
        },
      });
      await prisma.marketplaceJob.update({
        where: { id: job.id },
        data: { status: MarketplaceJobStatus.RESOLVED },
      });
      // Then mark PAID_OUT if release succeeded
      await prisma.marketplaceJob.update({
        where: { id: job.id },
        data: { status: MarketplaceJobStatus.PAID_OUT },
      });
    } else if (parsed.data.resolution === "REFUNDED") {
      if (payment?.stripePaymentIntentId && isStripeConfigured()) {
        const stripe = getStripe();
        await stripe.refunds.create(
          { payment_intent: payment.stripePaymentIntentId },
          { idempotencyKey: `dispute_refund_${dispute.id}` }
        );
        await prisma.marketplacePayment.update({
          where: { id: payment.id },
          data: { status: MarketplacePaymentStatus.REFUNDED },
        });
      } else if (payment) {
        await prisma.marketplacePayment.update({
          where: { id: payment.id },
          data: { status: MarketplacePaymentStatus.REFUNDED },
        });
      }
      if (job.acceptedQuoteId) await voidFeeIfPending(job.acceptedQuoteId, adminId);
      await prisma.dispute.update({
        where: { id: dispute.id },
        data: {
          status: DisputeStatus.REFUNDED,
          resolution: parsed.data.notes || "Full refund to customer",
        },
      });
      await prisma.marketplaceJob.update({
        where: { id: job.id },
        data: { status: MarketplaceJobStatus.RESOLVED },
      });
    } else {
      // PARTIAL_RELEASE
      const traderAmount = parsed.data.traderAmount ?? quote.amount * 0.5;
      if (traderAmount > quote.amount) {
        return { success: false as const, message: "Trader amount cannot exceed quote." };
      }
      const refundAmount = Math.round((quote.amount - traderAmount) * 100) / 100;

      const trader = await prisma.user.findUnique({
        where: { id: quote.traderId },
        select: { stripeAccountId: true },
      });

      let transferId: string | null = null;
      if (isStripeConfigured() && trader?.stripeAccountId && traderAmount > 0) {
        const stripe = getStripe();
        // Adjust fee: collect fee only on trader portion or void and charge proportionally
        const fee = await prisma.feeLedger.findUnique({ where: { quoteId: quote.id } });
        const feeShare =
          fee && fee.status === FeeLedgerStatus.PENDING
            ? Math.min(fee.amount, traderAmount)
            : 0;
        const net = Math.max(0, Math.round((traderAmount - feeShare) * 100) / 100);

        const transfer = await stripe.transfers.create(
          {
            amount: toStripeAmount(net),
            currency: "inr",
            destination: trader.stripeAccountId,
            transfer_group: job.id,
            metadata: { disputeId: dispute.id, partial: "true" },
          },
          { idempotencyKey: `dispute_partial_${dispute.id}` }
        );
        transferId = transfer.id;

        if (fee && fee.status === FeeLedgerStatus.PENDING) {
          await prisma.feeLedger.update({
            where: { id: fee.id },
            data: { status: FeeLedgerStatus.COLLECTED, amount: feeShare },
          });
        }

        await prisma.payout.create({
          data: {
            traderId: quote.traderId,
            jobId: job.id,
            netAmount: net,
            stripeTransferId: transferId,
          },
        });
      }

      if (payment?.stripePaymentIntentId && isStripeConfigured() && refundAmount > 0) {
        const stripe = getStripe();
        await stripe.refunds.create(
          {
            payment_intent: payment.stripePaymentIntentId,
            amount: toStripeAmount(refundAmount + (payment.protectionFee || 0)),
          },
          { idempotencyKey: `dispute_partial_refund_${dispute.id}` }
        );
        await prisma.marketplacePayment.update({
          where: { id: payment.id },
          data: { status: MarketplacePaymentStatus.PARTIALLY_REFUNDED },
        });
      }

      await prisma.dispute.update({
        where: { id: dispute.id },
        data: {
          status: DisputeStatus.PARTIAL_RELEASE,
          resolution:
            parsed.data.notes ||
            `Partial: trader ₹${traderAmount}, customer refund ≈ ₹${refundAmount}`,
        },
      });
      await prisma.marketplaceJob.update({
        where: { id: job.id },
        data: { status: MarketplaceJobStatus.RESOLVED },
      });
    }

    await prisma.auditLog.create({
      data: {
        entity: "dispute",
        entityId: dispute.id,
        action: "resolved",
        actorId: adminId,
        after: {
          resolution: parsed.data.resolution,
          notes: parsed.data.notes ?? null,
        },
      },
    });

    void createNotification({
      userId: job.clientId,
      title: "Dispute resolved",
      message: `Your dispute on “${job.title}” was resolved: ${parsed.data.resolution.replaceAll("_", " ")}.`,
      type: "INFO",
      link: `/customer/jobs/${job.id}`,
    });
    void createNotification({
      userId: quote.traderId,
      title: "Dispute resolved",
      message: `Dispute on “${job.title}” resolved: ${parsed.data.resolution.replaceAll("_", " ")}.`,
      type: "INFO",
      link: `/construction/jobs/${job.id}`,
    });

    revalidatePath("/disputes");
    revalidatePath(`/disputes/${dispute.id}`);
    revalidatePath(`/customer/jobs/${job.id}`);
    revalidatePath(`/construction/jobs/${job.id}`);

    return { success: true as const, message: `Dispute resolved: ${parsed.data.resolution}` };
  } catch (err) {
    console.error("[RESOLVE_DISPUTE]", err);
    return {
      success: false as const,
      message: err instanceof Error ? err.message : "Could not resolve dispute.",
    };
  }
}
