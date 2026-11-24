import prisma from "@/lib/prisma";
import {
  MarketplaceJobStatus,
  QuoteStatus,
  FeeLedgerStatus,
  ProtectionStatus,
} from "@/generated/prisma";
import { getPricingConfig, resolveJobSize } from "@/lib/pricing";
import { calcCommission, createCommissionInvoice } from "@/lib/trader-billing";

/**
 * When a contractor accepts a service request, create a payable marketplace deal:
 * MarketplaceJob (AWARDED) + Quote (ACCEPTED) + FeeLedger (PENDING).
 * Client then pays full or in installments; commission is taken on the first payment only.
 */
export async function createDealFromAcceptedServiceRequest(opts: {
  requestId: string;
  contractorId: string;
  /** Optional amount override when accepting (otherwise uses request budget / service price) */
  agreedAmount?: number | null;
}) {
  const request = await prisma.serviceRequest.findFirst({
    where: {
      id: opts.requestId,
      service: { contractorId: opts.contractorId },
    },
    include: {
      service: true,
      client: { select: { id: true, name: true } },
    },
  });

  if (!request) {
    throw new Error("Request not found or not authorized.");
  }

  if (request.marketplaceJobId) {
    return { jobId: request.marketplaceJobId, alreadyCreated: true as const };
  }

  const fromService =
    request.service.priceFrom != null
      ? request.service.priceFrom
      : request.service.priceTo != null
        ? request.service.priceTo
        : null;

  const agreed =
    opts.agreedAmount != null && Number.isFinite(opts.agreedAmount) && opts.agreedAmount > 0
      ? opts.agreedAmount
      : request.budget != null && request.budget > 0
        ? request.budget
        : fromService;

  if (agreed == null || agreed <= 0) {
    throw new Error(
      "Set an agreed amount (or ask the client for a budget) before accepting."
    );
  }

  const config = await getPricingConfig();
  const commission = calcCommission(agreed, config);
  const rate = config.commissionRate ?? 0.08;
  const jobSize = resolveJobSize(agreed, agreed, config);
  const description =
    request.message?.trim() ||
    `Service request for “${request.service.title}” from ${request.client.name ?? "client"}.`;

  const result = await prisma.$transaction(async (tx) => {
    const job = await tx.marketplaceJob.create({
      data: {
        title: request.service.title,
        description,
        category: request.service.category,
        location: request.location ?? undefined,
        photos: [],
        budgetMin: agreed,
        budgetMax: agreed,
        jobSize,
        status: MarketplaceJobStatus.AWARDED,
        protectionStatus: ProtectionStatus.UNDECIDED,
        clientId: request.clientId,
        serviceId: request.serviceId,
        amountPaid: 0,
      },
    });

    const quote = await tx.quote.create({
      data: {
        jobId: job.id,
        traderId: opts.contractorId,
        amount: agreed,
        scope: `Accepted service request for “${request.service.title}”.`,
        validUntil: new Date(Date.now() + (config.quoteValidDays || 14) * 86400000),
        status: QuoteStatus.ACCEPTED,
      },
    });

    const fee = await tx.feeLedger.create({
      data: {
        quoteId: quote.id,
        traderId: opts.contractorId,
        amount: commission,
        rate,
        status: FeeLedgerStatus.PENDING,
      },
    });

    await tx.marketplaceJob.update({
      where: { id: job.id },
      data: { acceptedQuoteId: quote.id },
    });

    await tx.serviceRequest.update({
      where: { id: request.id },
      data: {
        marketplaceJobId: job.id,
        budget: agreed,
      },
    });

    await tx.auditLog.create({
      data: {
        entity: "service_request",
        entityId: request.id,
        action: "accepted_create_deal",
        actorId: opts.contractorId,
        after: {
          jobId: job.id,
          quoteId: quote.id,
          agreedAmount: agreed,
          commission,
        },
      },
    });

    return { jobId: job.id, quoteId: quote.id, feeLedgerId: fee.id, agreed, commission, rate };
  });

  await createCommissionInvoice({
    traderId: opts.contractorId,
    quoteId: result.quoteId,
    jobId: result.jobId,
    jobTitle: request.service.title,
    feeLedgerId: result.feeLedgerId,
    amount: result.commission,
    rate: result.rate,
  }).catch(() => {});

  return { ...result, alreadyCreated: false as const };
}
