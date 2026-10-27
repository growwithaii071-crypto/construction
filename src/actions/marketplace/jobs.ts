"use server";

import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import {
  UserRole,
  InvitationStatus,
  MarketplaceJobStatus,
} from "@/generated/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { inviteTradersToJob, maintainLiveInvitations } from "@/lib/matching";
import { createNotification } from "@/lib/notifications";

const CreateJobSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(120),
  description: z.string().min(20, "Please describe the job in more detail").max(4000),
  category: z.string().min(2, "Category is required").max(80),
  location: z.string().max(120).optional(),
  budgetMin: z.coerce.number().min(0).optional().nullable(),
  budgetMax: z.coerce.number().min(0).optional().nullable(),
  photos: z.array(z.string().min(1)).max(8).optional(),
});

export async function createJobAction(formData: FormData) {
  const session = await requireAuth([UserRole.CLIENT]);

  const photosRaw = String(formData.get("photos") || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const parsed = CreateJobSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    category: formData.get("category"),
    location: formData.get("location") || undefined,
    budgetMin: formData.get("budgetMin") || null,
    budgetMax: formData.get("budgetMax") || null,
    photos: photosRaw.length ? photosRaw : undefined,
  });

  if (!parsed.success) {
    return { success: false as const, message: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const data = parsed.data;
  if (
    data.budgetMin != null &&
    data.budgetMax != null &&
    data.budgetMax < data.budgetMin
  ) {
    return { success: false as const, message: "Max budget must be ≥ min budget." };
  }

  try {
    const job = await prisma.marketplaceJob.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        location: data.location || null,
        budgetMin: data.budgetMin ?? null,
        budgetMax: data.budgetMax ?? null,
        photos: data.photos ?? [],
        status: MarketplaceJobStatus.OPEN,
        clientId: session.user.id!,
      },
    });

    await prisma.auditLog.create({
      data: {
        entity: "marketplace_job",
        entityId: job.id,
        action: "created",
        actorId: session.user.id,
        after: { title: job.title, category: job.category },
      },
    });

    const match = await inviteTradersToJob(job.id);

    revalidatePath("/customer/jobs");
    revalidatePath("/construction/invitations");

    return {
      success: true as const,
      jobId: job.id,
      invited: match.invited,
      message:
        match.invited > 0
          ? `Job posted. ${match.invited} trader${match.invited === 1 ? "" : "s"} invited.`
          : "Job posted. No matching verified traders yet — we’ll invite as they become available.",
    };
  } catch (err) {
    console.error("[CREATE_JOB]", err);
    return { success: false as const, message: "Could not create job." };
  }
}

export async function declineInvitationAction(invitationId: string) {
  const session = await requireAuth([UserRole.CONTRACTOR]);
  const traderId = session.user.id!;

  const inv = await prisma.jobInvitation.findUnique({
    where: { id: invitationId },
    include: { job: { select: { id: true, title: true, clientId: true, status: true } } },
  });

  if (!inv || inv.traderId !== traderId) {
    return { success: false as const, message: "Invitation not found." };
  }

  if (
    ![InvitationStatus.SENT, InvitationStatus.VIEWED].includes(
      inv.status as typeof InvitationStatus.SENT
    )
  ) {
    return { success: false as const, message: "This invitation can no longer be declined." };
  }

  await prisma.jobInvitation.update({
    where: { id: invitationId },
    data: { status: InvitationStatus.DECLINED },
  });

  await prisma.auditLog.create({
    data: {
      entity: "job_invitation",
      entityId: invitationId,
      action: "declined",
      actorId: traderId,
    },
  });

  void createNotification({
    userId: inv.job.clientId,
    title: "A trader declined your job",
    message: `A trader declined “${inv.job.title}”. We’re inviting the next best match.`,
    type: "INFO",
    link: `/customer/jobs/${inv.job.id}`,
  });

  // Keep 3 live invitations
  await maintainLiveInvitations(inv.job.id);

  revalidatePath("/construction/invitations");
  revalidatePath(`/customer/jobs/${inv.job.id}`);

  return { success: true as const, message: "Invitation declined." };
}

export async function markInvitationViewedAction(invitationId: string) {
  const session = await requireAuth([UserRole.CONTRACTOR]);

  const inv = await prisma.jobInvitation.findUnique({ where: { id: invitationId } });
  if (!inv || inv.traderId !== session.user.id) return;

  if (inv.status === InvitationStatus.SENT) {
    await prisma.jobInvitation.update({
      where: { id: invitationId },
      data: { status: InvitationStatus.VIEWED, viewedAt: new Date() },
    });
  }

  await maintainLiveInvitations(inv.jobId);
}

export async function cancelJobAction(jobId: string) {
  const session = await requireAuth([UserRole.CLIENT]);

  const job = await prisma.marketplaceJob.findUnique({ where: { id: jobId } });
  if (!job || job.clientId !== session.user.id) {
    return { success: false as const, message: "Job not found." };
  }

  if (
    ![MarketplaceJobStatus.OPEN, MarketplaceJobStatus.QUOTES_RECEIVED].includes(
      job.status as typeof MarketplaceJobStatus.OPEN
    )
  ) {
    return { success: false as const, message: "This job can no longer be cancelled." };
  }

  await prisma.marketplaceJob.update({
    where: { id: jobId },
    data: { status: MarketplaceJobStatus.CANCELLED },
  });

  await prisma.jobInvitation.updateMany({
    where: {
      jobId,
      status: { in: [InvitationStatus.SENT, InvitationStatus.VIEWED] },
    },
    data: { status: InvitationStatus.EXPIRED },
  });

  await prisma.auditLog.create({
    data: {
      entity: "marketplace_job",
      entityId: jobId,
      action: "cancelled",
      actorId: session.user.id,
    },
  });

  revalidatePath("/customer/jobs");
  revalidatePath(`/customer/jobs/${jobId}`);
  return { success: true as const, message: "Job cancelled." };
}

/** Public categories for forms — union of service categories + defaults. */
export async function getJobCategories(): Promise<string[]> {
  const defaults = [
    "Plumbing & Sanitation",
    "Electrical Works",
    "Painting & Finishing",
    "Roofing & Waterproofing",
    "Interior Finishing",
    "Residential Construction",
    "Commercial Construction",
    "Renovation & Remodeling",
    "Landscaping",
    "HVAC & Ventilation",
    "Carpentry",
    "Handyman",
  ];
  try {
    const fromDb = await prisma.service.findMany({
      where: { isActive: true },
      select: { category: true },
    });
    return [...new Set([...defaults, ...fromDb.map((s) => s.category)])].sort();
  } catch {
    return defaults;
  }
}
