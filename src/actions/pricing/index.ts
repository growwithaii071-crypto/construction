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
import { MONEY_CODE } from "@/lib/money";

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
  smallBudgetMax: z.coerce.number().min(0),
  mediumBudgetMax: z.coerce.number().min(0),
  smallLeadMin: z.coerce.number().min(0),
  smallLeadMax: z.coerce.number().min(0),
  smallLeadDefault: z.coerce.number().min(0),
  mediumLeadMin: z.coerce.number().min(0),
  mediumLeadMax: z.coerce.number().min(0),
  mediumLeadDefault: z.coerce.number().min(0),
  largeLeadMin: z.coerce.number().min(0),
  largeLeadMax: z.coerce.number().min(0),
  largeLeadDefault: z.coerce.number().min(0),
});

export async function savePricingConfigAction(formData: FormData) {
  const session = await requireAdmin();

  const feeType = String(formData.get("traderFeeType") || "LEAD_BY_SIZE");
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
    matchingInviteCount: formData.get("matchingInviteCount") || 3,
    maxReassignments: formData.get("maxReassignments"),
    termsVersion: formData.get("termsVersion") || "v1.0",
    smallBudgetMax: formData.get("smallBudgetMax"),
    mediumBudgetMax: formData.get("mediumBudgetMax"),
    smallLeadMin: formData.get("smallLeadMin"),
    smallLeadMax: formData.get("smallLeadMax"),
    smallLeadDefault: formData.get("smallLeadDefault"),
    mediumLeadMin: formData.get("mediumLeadMin"),
    mediumLeadMax: formData.get("mediumLeadMax"),
    mediumLeadDefault: formData.get("mediumLeadDefault"),
    largeLeadMin: formData.get("largeLeadMin"),
    largeLeadMax: formData.get("largeLeadMax"),
    largeLeadDefault: formData.get("largeLeadDefault"),
  });

  if (!parsed.success) {
    return { success: false as const, message: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const data = parsed.data;
  if (data.mediumBudgetMax <= data.smallBudgetMax) {
    return {
      success: false as const,
      message: "Medium budget max must be greater than small budget max.",
    };
  }

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
        leadCurrency: MONEY_CODE,
        smallBudgetMax: data.smallBudgetMax,
        mediumBudgetMax: data.mediumBudgetMax,
        smallLeadMin: data.smallLeadMin,
        smallLeadMax: data.smallLeadMax,
        smallLeadDefault: data.smallLeadDefault,
        mediumLeadMin: data.mediumLeadMin,
        mediumLeadMax: data.mediumLeadMax,
        mediumLeadDefault: data.mediumLeadDefault,
        largeLeadMin: data.largeLeadMin,
        largeLeadMax: data.largeLeadMax,
        largeLeadDefault: data.largeLeadDefault,
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
          smallLeadDefault: before.smallLeadDefault,
          mediumLeadDefault: before.mediumLeadDefault,
          largeLeadDefault: before.largeLeadDefault,
          matchingInviteCount: before.matchingInviteCount,
        },
        after: {
          traderFeeType: updated.traderFeeType,
          traderFeeRate: updated.traderFeeRate,
          smallLeadDefault: updated.smallLeadDefault,
          mediumLeadDefault: updated.mediumLeadDefault,
          largeLeadDefault: updated.largeLeadDefault,
          matchingInviteCount: updated.matchingInviteCount,
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
