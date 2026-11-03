import prisma from "@/lib/prisma";
import {
  InvitationStatus,
  MarketplaceJobStatus,
  QuoteStatus,
} from "@/generated/prisma";
import { maintainLiveInvitations } from "@/lib/matching";
import { processAutoConfirms } from "@/lib/marketplace-payouts";

/** Expire SENT/VIEWED invitations past expiresAt. */
export async function expireStaleInvitations() {
  const now = new Date();
  const expired = await prisma.jobInvitation.updateMany({
    where: {
      status: { in: [InvitationStatus.SENT, InvitationStatus.VIEWED] },
      expiresAt: { lt: now },
    },
    data: { status: InvitationStatus.EXPIRED },
  });

  // Top up live invites on still-open jobs
  const openJobs = await prisma.marketplaceJob.findMany({
    where: {
      status: {
        in: [MarketplaceJobStatus.OPEN, MarketplaceJobStatus.QUOTES_RECEIVED],
      },
    },
    select: { id: true },
    take: 80,
    orderBy: { updatedAt: "desc" },
  });

  let toppedUp = 0;
  for (const job of openJobs) {
    const res = await maintainLiveInvitations(job.id);
    toppedUp += res.invited;
  }

  return { expired: expired.count, toppedUp, jobsScanned: openJobs.length };
}

/** Mark SUBMITTED quotes past validUntil as EXPIRED. */
export async function expireStaleQuotes() {
  const now = new Date();
  const result = await prisma.quote.updateMany({
    where: {
      status: QuoteStatus.SUBMITTED,
      validUntil: { lt: now },
    },
    data: { status: QuoteStatus.EXPIRED },
  });
  return { expired: result.count };
}

/** Full marketplace maintenance tick (cron). */
export async function runMarketplaceMaintenance() {
  const [invites, quotes, autoConfirm] = await Promise.all([
    expireStaleInvitations(),
    expireStaleQuotes(),
    processAutoConfirms(40),
  ]);

  return {
    invitations: invites,
    quotes,
    autoConfirm: {
      processed: autoConfirm.length,
      released: autoConfirm.filter((r) => r.released).length,
      jobIds: autoConfirm.map((r) => r.jobId),
    },
    ranAt: new Date().toISOString(),
  };
}
