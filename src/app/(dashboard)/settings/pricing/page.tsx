import { requireAuth } from "@/lib/auth-utils";
import { UserRole } from "@/generated/prisma";
import Link from "next/link";
import { ArrowLeft, BadgeIndianRupee } from "lucide-react";
import { getPricingConfig, buildPricePreview } from "@/lib/pricing";
import { PricingConfigForm } from "@/components/admin/pricing-config-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Marketplace Pricing" };

export default async function PricingSettingsPage() {
  await requireAuth([UserRole.ADMIN, UserRole.SUPER_ADMIN]);

  const config = await getPricingConfig();
  const sample = buildPricePreview(50000, config);

  const initial = {
    traderFeeType: config.traderFeeType as "PERCENTAGE" | "FIXED",
    traderFeeRatePct:
      config.traderFeeType === "PERCENTAGE"
        ? Number((config.traderFeeRate * 100).toFixed(2))
        : 10,
    traderFeeFixed: config.traderFeeType === "FIXED" ? config.traderFeeRate : 500,
    traderFeeCap: config.traderFeeCap,
    protectionFeeEnabled: config.protectionFeeEnabled,
    protectionFeeRatePct: Number((config.protectionFeeRate * 100).toFixed(2)),
    protectionFeeDefault: config.protectionFeeDefault as "OPT_IN" | "OPT_OUT",
    unprotectedReleaseAt: config.unprotectedReleaseAt as "JOB_START" | "COMPLETION",
    quoteValidDays: config.quoteValidDays,
    invitationExpiryHours: config.invitationExpiryHours,
    autoConfirmDays: config.autoConfirmDays,
    matchingInviteCount: config.matchingInviteCount,
    maxReassignments: config.maxReassignments,
    termsVersion: config.termsVersion,
  };

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div>
        <Link
          href="/settings"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Settings
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
            <BadgeIndianRupee className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Marketplace pricing
            </h1>
            <p className="text-sm text-slate-500">
              Trader success fees, payment protection and matching rules — change without a release
            </p>
          </div>
        </div>
      </div>

      {/* Live preview */}
      <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
          Preview · ₹50,000 quote
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <PreviewStat
            label="Trader success fee"
            value={`₹${sample.traderSuccessFee.toLocaleString("en-IN")}`}
            hint={sample.traderFeeLabel}
          />
          <PreviewStat
            label="Customer (Protected)"
            value={`₹${sample.customerTotalProtected.toLocaleString("en-IN")}`}
            hint={`incl. ₹${sample.protectionFee.toLocaleString("en-IN")} protection`}
          />
          <PreviewStat
            label="Customer (Unprotected)"
            value={`₹${sample.customerTotalUnprotected.toLocaleString("en-IN")}`}
            hint="Quote only"
          />
        </div>
      </div>

      <PricingConfigForm initial={initial} />
    </div>
  );
}

function PreviewStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-white bg-white px-4 py-3 shadow-sm">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-extrabold text-[#0B2A4A]">{value}</p>
      <p className="mt-0.5 text-xs text-slate-400">{hint}</p>
    </div>
  );
}
