"use server";

import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import {
  UserRole,
  TraderFeeType,
  ProtectionDefaultMode,
  UnprotectedReleaseTiming,
} from "@/generated/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getPricingConfig } from "@/lib/pricing";

async function requireAdmin() {
  return requireAuth([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
}

const PricingSchema = z.object({
  traderFeeType: z.nativeEnum(TraderFeeType),
  traderFeeRate: z.coerce.number().min(0),
  traderFeeCap: z.union([z.coerce.number().min(0), z.literal("")]).optional(),
  protectionFeeEnabled: z.boolean(),
  protectionFeeRate: z.coerce.number().min(0).max(1),
  protectionFeeDefault: z.nativeEnum(ProtectionDefaultMode),
  unprotectedReleaseAt: z.nativeEnum(UnprotectedReleaseTiming),
  quoteValidDays: z.coerce.number().int().min(1).max(90),
  invitationExpiryHours: z.coerce.number().int().min(1).max(168),
  autoConfirmDays: z.coerce.number().int().min(1).max(30),
  matchingInviteCount: z.coerce.number().int().min(1).max(10),
  maxReassignments: z.coerce.number().int().min(0).max(50),
  termsVersion: z.string().min(1).max(40),
});

export async function savePricingConfigAction(formData: FormData) {
  const session = await requireAdmin();

  const feeType = String(formData.get("traderFeeType") || "PERCENTAGE");
  const rawRate = Number(formData.get("traderFeeRate"));
  // UI shows percentage as 10 for 10%; store as 0.10 when PERCENTAGE
  const traderFeeRate =
    feeType === "PERCENTAGE" ? (Number.isFinite(rawRate) ? rawRate / 100 : 0) : rawRate;

  const protectionPct = Number(formData.get("protectionFeeRate"));
  const protectionFeeRate = Number.isFinite(protectionPct) ? protectionPct / 100 : 0.03;

  const capRaw = String(formData.get("traderFeeCap") ?? "").trim();

  const parsed = PricingSchema.safeParse({
    traderFeeType: feeType,
    traderFeeRate,
    traderFeeCap: capRaw === "" ? "" : capRaw,
    protectionFeeEnabled: formData.get("protectionFeeEnabled") === "on",
    protectionFeeRate,
    protectionFeeDefault: formData.get("protectionFeeDefault") || "OPT_IN",
    unprotectedReleaseAt: formData.get("unprotectedReleaseAt") || "JOB_START",
    quoteValidDays: formData.get("quoteValidDays"),
    invitationExpiryHours: formData.get("invitationExpiryHours"),
    autoConfirmDays: formData.get("autoConfirmDays"),
    matchingInviteCount: formData.get("matchingInviteCount"),
    maxReassignments: formData.get("maxReassignments"),
    termsVersion: formData.get("termsVersion") || "v1.0",
  });

  if (!parsed.success) {
    return { success: false as const, message: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const data = parsed.data;
  const traderFeeCap =
    data.traderFeeCap === "" || data.traderFeeCap === undefined
      ? null
      : Number(data.traderFeeCap);

  try {
    const existing = await getPricingConfig();
    const before = { ...existing };

    const updated = await prisma.pricingConfig.update({
      where: { id: existing.id },
      data: {
        traderFeeType: data.traderFeeType,
        traderFeeRate: data.traderFeeRate,
        traderFeeCap,
        protectionFeeEnabled: data.protectionFeeEnabled,
        protectionFeeRate: data.protectionFeeRate,
        protectionFeeDefault: data.protectionFeeDefault,
        unprotectedReleaseAt: data.unprotectedReleaseAt,
        quoteValidDays: data.quoteValidDays,
        invitationExpiryHours: data.invitationExpiryHours,
        autoConfirmDays: data.autoConfirmDays,
        matchingInviteCount: data.matchingInviteCount,
        maxReassignments: data.maxReassignments,
        termsVersion: data.termsVersion,
        updatedById: session.user.id,
      },
    });

    await prisma.auditLog.create({
      data: {
        entity: "pricing_config",
        entityId: updated.id,
        action: "UPDATE",
        actorId: session.user.id,
        before: {
          traderFeeType: before.traderFeeType,
          traderFeeRate: before.traderFeeRate,
          traderFeeCap: before.traderFeeCap,
          protectionFeeRate: before.protectionFeeRate,
          protectionFeeDefault: before.protectionFeeDefault,
        },
        after: {
          traderFeeType: updated.traderFeeType,
          traderFeeRate: updated.traderFeeRate,
          traderFeeCap: updated.traderFeeCap,
          protectionFeeRate: updated.protectionFeeRate,
          protectionFeeDefault: updated.protectionFeeDefault,
        },
      },
    });

    revalidatePath("/settings/pricing");
    return { success: true as const, message: "Pricing saved." };
  } catch (err) {
    console.error("[PRICING_SAVE]", err);
    return { success: false as const, message: "Could not save pricing config." };
  }
}
