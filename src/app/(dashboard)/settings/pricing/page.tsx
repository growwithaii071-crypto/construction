import { requireAuth } from "@/lib/auth-utils";
import { UserRole } from "@/generated/prisma";
import Link from "next/link";
import { ArrowLeft, BadgePoundSterling } from "lucide-react";
import {
  getPricingConfig,
  buildPricePreview,
  listSuccessFeeTiers,
  formatSuccessFeeBand,
} from "@/lib/pricing";
import { MONEY_SYMBOL } from "@/lib/money";
import { PricingConfigForm } from "@/components/admin/pricing-config-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Marketplace Pricing" };

export default async function PricingSettingsPage() {
  await requireAuth([UserRole.ADMIN, UserRole.SUPER_ADMIN]);

  const config = await getPricingConfig();
  const tiers = listSuccessFeeTiers(config);
  const sym = MONEY_SYMBOL;
  const maxTraders = config.matchingInviteCount;
  const sample = buildPricePreview(5000, config);

  const initial = {
    traderFeeType: "LEAD_BY_SIZE" as const,
    traderFeeRatePct: 10,
    traderFeeFixed: 500,
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
    smallBudgetMax: config.smallBudgetMax,
    mediumBudgetMax: config.mediumBudgetMax,
    successFeeTiers: tiers,
  };

  return (
    <div className="w-full space-y-6 p-4 pb-10 sm:p-5 lg:p-6">
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
            <BadgePoundSterling className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Marketplace pricing
            </h1>
            <p className="text-sm text-slate-500">
              Trader success fee by job value, protection fee, and max traders per lead
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-orange-100 bg-orange-50/40">
        <table className="min-w-full text-left text-sm">
          <thead className="text-xs font-semibold uppercase tracking-wide text-orange-800/80">
            <tr>
              <th className="px-4 py-3">Job value</th>
              <th className="px-4 py-3">Success fee</th>
              <th className="px-4 py-3">Max traders</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-orange-100/80 bg-white/70">
            {tiers.map((tier) => (
              <tr key={`${tier.min}-${tier.max ?? "open"}`}>
                <td className="px-4 py-3 font-semibold text-[#0B2A4A]">
                  {formatSuccessFeeBand(tier)}
                </td>
                <td className="px-4 py-3 text-lg font-extrabold text-slate-900">
                  {sym}
                  {tier.fee.toLocaleString("en-GB")}
                </td>
                <td className="px-4 py-3 font-bold text-slate-900">{maxTraders}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Preview · {sym}5,000 quote → success fee {sym}25
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <PreviewStat
            label="Trader success fee"
            value={`${sym}${sample.traderSuccessFee.toLocaleString("en-GB")}`}
            hint={sample.traderFeeLabel}
          />
          <PreviewStat
            label="Max traders / lead"
            value={String(maxTraders)}
            hint="Invites sent per job"
          />
          <PreviewStat
            label="Customer (Protected)"
            value={`${sym}${sample.customerTotalProtected.toLocaleString("en-GB")}`}
            hint={`incl. ${sym}${sample.protectionFee.toLocaleString("en-GB")} protection`}
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
