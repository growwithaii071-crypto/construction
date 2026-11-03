"use server";

import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { UserRole, QuoteStatus } from "@/generated/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createNotification } from "@/lib/notifications";

const Schema = z.object({
  jobId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export async function submitJobReviewAction(formData: FormData) {
  const session = await requireAuth([UserRole.CLIENT]);
  const clientId = session.user.id!;

  const parsed = Schema.safeParse({
    jobId: formData.get("jobId"),
    rating: formData.get("rating"),
    comment: formData.get("comment") || undefined,
  });
  if (!parsed.success) {
    return { success: false as const, message: parsed.error.issues[0]?.message ?? "Invalid" };
  }

  const job = await prisma.marketplaceJob.findUnique({ where: { id: parsed.data.jobId } });
  if (!job || job.clientId !== clientId) {
    return { success: false as const, message: "Job not found." };
  }

  if (!["COMPLETED", "PAID_OUT", "RESOLVED"].includes(job.status)) {
    return { success: false as const, message: "You can review after the job is completed." };
  }

  const existing = await prisma.jobReview.findUnique({ where: { jobId: job.id } });
  if (existing) {
    return { success: false as const, message: "You already reviewed this job." };
  }

  const quote = job.acceptedQuoteId
    ? await prisma.quote.findUnique({ where: { id: job.acceptedQuoteId } })
    : await prisma.quote.findFirst({
        where: { jobId: job.id, status: QuoteStatus.ACCEPTED },
      });
  if (!quote) {
    return { success: false as const, message: "Accepted trader missing." };
  }

  await prisma.jobReview.create({
    data: {
      jobId: job.id,
      clientId,
      traderId: quote.traderId,
      rating: parsed.data.rating,
      comment: parsed.data.comment?.trim() || null,
    },
  });

  void createNotification({
    userId: quote.traderId,
    title: "New review received",
    message: `You got ${parsed.data.rating}★ on “${job.title}”.`,
    type: "SUCCESS",
    link: "/construction/reviews",
  });

  revalidatePath(`/customer/jobs/${job.id}`);
  revalidatePath("/construction/reviews");
  revalidatePath("/");

  return { success: true as const, message: "Thanks for your review!" };
}

export async function getPlatformRatingStats() {
  try {
    const agg = await prisma.jobReview.aggregate({
      _avg: { rating: true },
      _count: true,
    });
    const jobsDone = await prisma.marketplaceJob.count({
      where: { status: { in: ["PAID_OUT", "COMPLETED", "RESOLVED"] } },
    });
    return {
      avgRating: agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : null,
      reviewCount: agg._count,
      jobsDone,
    };
  } catch {
    return { avgRating: null, reviewCount: 0, jobsDone: 0 };
  }
}
