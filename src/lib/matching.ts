import prisma from "@/lib/prisma";
import { InvitationStatus, MarketplaceJobStatus, UserRole } from "@/generated/prisma";
import { getPricingConfig } from "@/lib/pricing";
import { createNotification } from "@/lib/notifications";
import { computeVerified } from "@/lib/stripe";

export type MatchCandidate = {
  traderId: string;
  name: string;
  score: number;
  verified: boolean;
  categoryMatch: boolean;
};

/**
 * Rank traders for a job.
 * Score = category match + request volume (proxy rating) − recent invite load (fairness).
 * Verified Connect traders are always preferred.
 */
export async function findMatchingTraders(opts: {
  category: string;
  location?: string | null;
  excludeTraderIds?: string[];
  limit: number;
}): Promise<MatchCandidate[]> {
  const exclude = new Set(opts.excludeTraderIds ?? []);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const category = opts.category.trim();
  const location = opts.location?.trim().toLowerCase() ?? "";

  const contractors = await prisma.user.findMany({
    where: {
      role: UserRole.CONTRACTOR,
      isActive: true,
      id: exclude.size ? { notIn: [...exclude] } : undefined,
    },
    select: {
      id: true,
      name: true,
      stripeOnboardingDone: true,
      stripePayoutsEnabled: true,
      feePaymentMethodId: true,
      contractorServices: {
        where: { isActive: true },
        select: {
          category: true,
          description: true,
          title: true,
          _count: { select: { requests: true } },
        },
      },
      jobInvitations: {
        where: { sentAt: { gte: thirtyDaysAgo } },
        select: { id: true },
      },
    },
  });

  const ranked: MatchCandidate[] = [];

  for (const c of contractors) {
    const verified = computeVerified({
      onboardingDone: c.stripeOnboardingDone,
      payoutsEnabled: c.stripePayoutsEnabled,
      feePaymentMethodId: c.feePaymentMethodId,
    });

    const categoryMatch = c.contractorServices.some(
      (s) => s.category.toLowerCase() === category.toLowerCase()
    );
    const softCategory = c.contractorServices.some(
      (s) =>
        s.category.toLowerCase().includes(category.toLowerCase().split(" ")[0] ?? "") ||
        s.title.toLowerCase().includes(category.toLowerCase().split(" ")[0] ?? "")
    );

    const requestVolume = c.contractorServices.reduce((n, s) => n + s._count.requests, 0);
    const recentInvites = c.jobInvitations.length;

    let locationBoost = 0;
    if (location) {
      const hay = c.contractorServices
        .map((s) => `${s.title} ${s.description} ${s.category}`)
        .join(" ")
        .toLowerCase();
      if (hay.includes(location)) locationBoost = 8;
    }

    // Prefer verified; unverified only used as backfill when not enough verified
    let score = 0;
    if (verified) score += 100;
    if (categoryMatch) score += 40;
    else if (softCategory) score += 15;
    score += Math.min(requestVolume, 30);
    score += locationBoost;
    score -= recentInvites * 5; // fairness rotation

    // Skip traders with no services at all
    if (c.contractorServices.length === 0) continue;

    ranked.push({
      traderId: c.id,
      name: c.name,
      score,
      verified,
      categoryMatch: categoryMatch || softCategory,
    });
  }

  ranked.sort((a, b) => b.score - a.score);

  const verified = ranked.filter((r) => r.verified);
  const pool = verified.length >= opts.limit ? verified : ranked;
  return pool.slice(0, opts.limit);
}

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

/** Create invitations for a job (initial match). */
export async function inviteTradersToJob(jobId: string) {
  const config = await getPricingConfig();
  const job = await prisma.marketplaceJob.findUnique({ where: { id: jobId } });
  if (!job || job.status === MarketplaceJobStatus.CANCELLED) {
    return { invited: 0 as const, traders: [] as string[] };
  }

  const existing = await prisma.jobInvitation.findMany({
    where: { jobId },
    select: { traderId: true },
  });
  const exclude = existing.map((e) => e.traderId);

  const liveCount = await prisma.jobInvitation.count({
    where: {
      jobId,
      status: { in: [InvitationStatus.SENT, InvitationStatus.VIEWED] },
    },
  });

  const need = Math.max(0, config.matchingInviteCount - liveCount);
  if (need === 0) return { invited: 0 as const, traders: [] as string[] };

  const candidates = await findMatchingTraders({
    category: job.category,
    location: job.location,
    excludeTraderIds: exclude,
    limit: need,
  });

  const now = new Date();
  const expiresAt = addHours(now, config.invitationExpiryHours);
  const maxRank = existing.length;

  const created: string[] = [];
  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i]!;
    const inv = await prisma.jobInvitation.create({
      data: {
        jobId,
        traderId: c.traderId,
        status: InvitationStatus.SENT,
        rank: maxRank + i + 1,
        sentAt: now,
        expiresAt,
      },
    });
    created.push(c.traderId);

    void createNotification({
      userId: c.traderId,
      title: "New job invitation",
      message: `You’ve been invited to quote on “${job.title}” (${job.category}). Expires in ${config.invitationExpiryHours}h.`,
      type: "INFO",
      link: `/construction/invitations/${inv.id}`,
    });
  }

  await prisma.auditLog.create({
    data: {
      entity: "marketplace_job",
      entityId: jobId,
      action: "invitations_sent",
      after: { traderIds: created, count: created.length },
    },
  });

  return { invited: created.length, traders: created };
}

/**
 * Expire stale invitations and top up to matchingInviteCount (reassignments).
 * Call on job views / invitation actions / cron.
 */
export async function maintainLiveInvitations(jobId: string) {
  const config = await getPricingConfig();
  const job = await prisma.marketplaceJob.findUnique({ where: { id: jobId } });
  if (
    !job ||
    (job.status !== MarketplaceJobStatus.OPEN &&
      job.status !== MarketplaceJobStatus.QUOTES_RECEIVED)
  ) {
    return { expired: 0, invited: 0 };
  }

  const now = new Date();
  const expiredResult = await prisma.jobInvitation.updateMany({
    where: {
      jobId,
      status: { in: [InvitationStatus.SENT, InvitationStatus.VIEWED] },
      expiresAt: { lt: now },
    },
    data: { status: InvitationStatus.EXPIRED },
  });

  const allInvites = await prisma.jobInvitation.findMany({
    where: { jobId },
    select: { status: true },
  });

  const reassigned = allInvites.filter((i) =>
    [InvitationStatus.DECLINED, InvitationStatus.EXPIRED].includes(
      i.status as typeof InvitationStatus.DECLINED
    )
  ).length;

  if (reassigned >= config.maxReassignments) {
    return { expired: expiredResult.count, invited: 0 };
  }

  const live = allInvites.filter((i) =>
    [InvitationStatus.SENT, InvitationStatus.VIEWED].includes(
      i.status as typeof InvitationStatus.SENT
    )
  ).length;

  let invited = 0;
  if (live < config.matchingInviteCount) {
    const room = Math.min(
      config.matchingInviteCount - live,
      config.maxReassignments - reassigned
    );
    if (room > 0) {
      // Temporarily lower matchingInviteCount by inviting via inviteTradersToJob logic
      // inviteTradersToJob fills up to config.matchingInviteCount — OK
      const res = await inviteTradersToJob(jobId);
      invited = res.invited;
    }
  }

  return { expired: expiredResult.count, invited };
}
