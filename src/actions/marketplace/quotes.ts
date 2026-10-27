"use server";

import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import {
  UserRole,
  InvitationStatus,
  MarketplaceJobStatus,
  QuoteStatus,
  FeeLedgerStatus,
  ProtectionStatus,
  MarketplacePaymentStatus,
} from "@/generated/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertTraderVerified } from "@/lib/trader-verification";
import {
  getPricingConfig,
  buildPricePreview,
  calcTraderSuccessFee,
  calcProtectionFee,
} from "@/lib/pricing";
import { createNotification } from "@/lib/notifications";

const SubmitQuoteSchema = z.object({
  invitationId: z.string().min(1),
  amount: z.coerce.number().positive("Quote amount must be greater than 0"),
  scope: z.string().max(4000).optional(),
  startDate: z.string().optional(),
});

export async function submitQuoteAction(formData: FormData) {
  const session = await requireAuth([UserRole.CONTRACTOR]);
  const traderId = session.user.id!;

  const parsed = SubmitQuoteSchema.safeParse({
    invitationId: formData.get("invitationId"),
    amount: formData.get("amount"),
    scope: formData.get("scope") || undefined,
    startDate: formData.get("startDate") || undefined,
  });

  if (!parsed.success) {
    return { success: false as const, message: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await assertTraderVerified(traderId);
  } catch (err) {
    return {
      success: false as const,
      message:
        err instanceof Error
          ? err.message
          : "Complete verification before quoting.",
    };
  }

  const inv = await prisma.jobInvitation.findUnique({
    where: { id: parsed.data.invitationId },
    include: { job: true },
  });

  if (!inv || inv.traderId !== traderId) {
    return { success: false as const, message: "Invitation not found." };
  }

  if (
    inv.status !== InvitationStatus.SENT &&
    inv.status !== InvitationStatus.VIEWED
  ) {
    return { success: false as const, message: "This invitation is no longer open for quotes." };
  }

  if (inv.expiresAt < new Date()) {
    await prisma.jobInvitation.update({
      where: { id: inv.id },
      data: { status: InvitationStatus.EXPIRED },
    });
    return { success: false as const, message: "Invitation has expired." };
  }

  if (
    inv.job.status !== MarketplaceJobStatus.OPEN &&
    inv.job.status !== MarketplaceJobStatus.QUOTES_RECEIVED
  ) {
    return { success: false as const, message: "This job is not accepting quotes." };
  }

  const existing = await prisma.quote.findFirst({
    where: {
      jobId: inv.jobId,
      traderId,
      status: { in: [QuoteStatus.SUBMITTED, QuoteStatus.ACCEPTED] },
    },
  });
  if (existing) {
    return { success: false as const, message: "You already submitted a quote for this job." };
  }

  const config = await getPricingConfig();
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + config.quoteValidDays);

  const startDate = parsed.data.startDate
    ? new Date(parsed.data.startDate)
    : null;

  try {
    const quote = await prisma.quote.create({
      data: {
        jobId: inv.jobId,
        traderId,
        amount: parsed.data.amount,
        scope: parsed.data.scope || null,
        startDate,
        validUntil,
        status: QuoteStatus.SUBMITTED,
      },
    });

    await prisma.jobInvitation.update({
      where: { id: inv.id },
      data: { status: InvitationStatus.QUOTED },
    });

    // Move job to QUOTES_RECEIVED when first quote arrives (or keep if already)
    if (inv.job.status === MarketplaceJobStatus.OPEN) {
      await prisma.marketplaceJob.update({
        where: { id: inv.jobId },
        data: { status: MarketplaceJobStatus.QUOTES_RECEIVED },
      });
    }

    // If all live invitations have quoted (or no live left), still QUOTES_RECEIVED
    const liveLeft = await prisma.jobInvitation.count({
      where: {
        jobId: inv.jobId,
        status: { in: [InvitationStatus.SENT, InvitationStatus.VIEWED] },
      },
    });
    if (liveLeft === 0) {
      await prisma.marketplaceJob.update({
        where: { id: inv.jobId },
        data: { status: MarketplaceJobStatus.QUOTES_RECEIVED },
      });
    }

    await prisma.auditLog.create({
      data: {
        entity: "quote",
        entityId: quote.id,
        action: "submitted",
        actorId: traderId,
        after: { amount: quote.amount, jobId: inv.jobId },
      },
    });

    void createNotification({
      userId: inv.job.clientId,
      title: "New quote received",
      message: `${session.user.name?.split(" — ")[0] ?? "A trader"} quoted ₹${quote.amount.toLocaleString("en-IN")} on “${inv.job.title}”.`,
      type: "SUCCESS",
      link: `/customer/jobs/${inv.jobId}`,
    });

    revalidatePath(`/construction/invitations/${inv.id}`);
    revalidatePath("/construction/invitations");
    revalidatePath(`/customer/jobs/${inv.jobId}`);

    return {
      success: true as const,
      quoteId: quote.id,
      message: "Quote submitted. The customer has been notified.",
    };
  } catch (err) {
    console.error("[SUBMIT_QUOTE]", err);
    return { success: false as const, message: "Could not submit quote." };
  }
}

export async function getQuotePricePreviewAction(quoteId: string) {
  const session = await requireAuth([UserRole.CLIENT, UserRole.CONTRACTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]);

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { job: true },
  });

  if (!quote) {
    return { success: false as const, message: "Quote not found." };
  }

  const role = session.user.role as UserRole;
  const isClient = role === UserRole.CLIENT && quote.job.clientId === session.user.id;
  const isTrader = role === UserRole.CONTRACTOR && quote.traderId === session.user.id;
  const isAdmin = role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
  if (!isClient && !isTrader && !isAdmin) {
    return { success: false as const, message: "Unauthorized." };
  }

  const config = await getPricingConfig();
  const preview = buildPricePreview(quote.amount, config, quote.job.category);

  return {
    success: true as const,
    quoteId: quote.id,
    expired: quote.validUntil < new Date(),
    validUntil: quote.validUntil.toISOString(),
    status: quote.status,
    preview,
  };
}

const AcceptSchema = z.object({
  quoteId: z.string().min(1),
  protection: z.enum(["true", "false"]),
  confirmExpired: z.enum(["true", "false"]).optional(),
});

/**
 * Atomic accept: only one ACCEPTED quote per job.
 * Client sends protection flag only — amounts from pricing_config.
 */
export async function acceptQuoteAction(formData: FormData) {
  const session = await requireAuth([UserRole.CLIENT]);
  const clientId = session.user.id!;

  const parsed = AcceptSchema.safeParse({
    quoteId: formData.get("quoteId"),
    protection: formData.get("protection"),
    confirmExpired: formData.get("confirmExpired") || undefined,
  });

  if (!parsed.success) {
    return { success: false as const, message: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const protectionOptedIn = parsed.data.protection === "true";
  const quoteId = parsed.data.quoteId;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const quote = await tx.quote.findUnique({
        where: { id: quoteId },
        include: { job: true },
      });

      if (!quote || quote.job.clientId !== clientId) {
        throw new Error("Quote not found.");
      }

      if (quote.status !== QuoteStatus.SUBMITTED) {
        throw new Error("This quote cannot be accepted.");
      }

      if (
        quote.job.status !== MarketplaceJobStatus.OPEN &&
        quote.job.status !== MarketplaceJobStatus.QUOTES_RECEIVED
      ) {
        throw new Error("This job is no longer accepting quotes.");
      }

      const alreadyAccepted = await tx.quote.findFirst({
        where: { jobId: quote.jobId, status: QuoteStatus.ACCEPTED },
      });
      if (alreadyAccepted) {
        throw new Error("Another quote was already accepted for this job.");
      }

      if (quote.validUntil < new Date() && parsed.data.confirmExpired !== "true") {
        throw new Error("QUOTE_EXPIRED");
      }

      const config = await getPricingConfig();
      const preview = buildPricePreview(quote.amount, config, quote.job.category);
      const protectionFee = protectionOptedIn
        ? calcProtectionFee(quote.amount, config, quote.job.category)
        : 0;
      const customerTotal = protectionOptedIn
        ? preview.customerTotalProtected
        : preview.customerTotalUnprotected;
      const traderFee = calcTraderSuccessFee(quote.amount, config, quote.job.category);

      await tx.quote.update({
        where: { id: quote.id },
        data: { status: QuoteStatus.ACCEPTED },
      });

      await tx.quote.updateMany({
        where: {
          jobId: quote.jobId,
          id: { not: quote.id },
          status: QuoteStatus.SUBMITTED,
        },
        data: { status: QuoteStatus.NOT_SELECTED },
      });

      await tx.feeLedger.create({
        data: {
          quoteId: quote.id,
          traderId: quote.traderId,
          amount: traderFee,
          status: FeeLedgerStatus.PENDING,
        },
      });

      await tx.marketplacePayment.create({
        data: {
          jobId: quote.jobId,
          quoteId: quote.id,
          customerTotal,
          protectionOptedIn,
          protectionFee,
          quoteAmount: quote.amount,
          termsVersion: config.termsVersion,
          status: MarketplacePaymentStatus.PENDING,
        },
      });

      await tx.marketplaceJob.update({
        where: { id: quote.jobId },
        data: {
          status: MarketplaceJobStatus.AWAITING_PAYMENT,
          protectionStatus: protectionOptedIn
            ? ProtectionStatus.PROTECTED
            : ProtectionStatus.UNPROTECTED,
          acceptedQuoteId: quote.id,
        },
      });

      // Expire remaining live invitations
      await tx.jobInvitation.updateMany({
        where: {
          jobId: quote.jobId,
          status: { in: [InvitationStatus.SENT, InvitationStatus.VIEWED] },
        },
        data: { status: InvitationStatus.EXPIRED },
      });

      await tx.auditLog.create({
        data: {
          entity: "quote",
          entityId: quote.id,
          action: "accepted",
          actorId: clientId,
          after: {
            protectionOptedIn,
            customerTotal,
            protectionFee,
            traderFee,
            termsVersion: config.termsVersion,
          },
        },
      });

      return {
        jobId: quote.jobId,
        quoteId: quote.id,
        traderId: quote.traderId,
        jobTitle: quote.job.title,
        customerTotal,
        protectionOptedIn,
        traderFee,
      };
    });

    // Notify non-selected + accepted trader
    const others = await prisma.quote.findMany({
      where: { jobId: result.jobId, status: QuoteStatus.NOT_SELECTED },
      select: { traderId: true },
    });

    for (const o of others) {
      void createNotification({
        userId: o.traderId,
        title: "Quote not selected",
        message: `The customer chose another quote for “${result.jobTitle}”. No fee was charged.`,
        type: "INFO",
        link: "/construction/invitations",
      });
    }

    void createNotification({
      userId: result.traderId,
      title: "Your quote was accepted!",
      message: `“${result.jobTitle}” — awaiting customer payment (${result.protectionOptedIn ? "Protected" : "Unprotected"}).`,
      type: "SUCCESS",
      link: `/construction/jobs/${result.jobId}`,
    });

    revalidatePath(`/customer/jobs/${result.jobId}`);
    revalidatePath("/customer/jobs");
    revalidatePath("/construction/invitations");

    return {
      success: true as const,
      jobId: result.jobId,
      quoteId: result.quoteId,
      customerTotal: result.customerTotal,
      message: "Quote accepted. Proceed to payment.",
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Could not accept quote.";
    if (msg === "QUOTE_EXPIRED") {
      return {
        success: false as const,
        code: "QUOTE_EXPIRED" as const,
        message: "This quote has expired. Confirm to accept the same price anyway.",
      };
    }
    console.error("[ACCEPT_QUOTE]", err);
    return { success: false as const, message: msg };
  }
}
