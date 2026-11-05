import prisma from "@/lib/prisma";
import {
  TraderFeeType,
  ProtectionDefaultMode,
  JobSize,
  type PricingConfig,
} from "@/generated/prisma";
import { MONEY_CODE, MONEY_SYMBOL } from "@/lib/money";

export type CategoryOverride = {
  traderFeeType?: TraderFeeType;
  traderFeeRate?: number;
  traderFeeCap?: number | null;
  protectionFeeRate?: number;
};

export type LeadBand = {
  size: JobSize;
  label: string;
  examples: string;
  budgetLabel: string;
  leadMin: number;
  leadMax: number;
  leadDefault: number;
  maxTraders: number;
};

export type PricePreview = {
  quoteAmount: number;
  traderSuccessFee: number;
  protectionFee: number;
  customerTotalProtected: number;
  customerTotalUnprotected: number;
  protectionFeeRate: number;
  traderFeeLabel: string;
  protectionEnabled: boolean;
  protectionDefault: ProtectionDefaultMode;
  termsVersion: string;
  jobSize?: JobSize | null;
  leadBand?: LeadBand | null;
};

const DEFAULTS = {
  key: "default",
  traderFeeType: TraderFeeType.LEAD_BY_SIZE,
  traderFeeRate: 0.1,
  traderFeeCap: null as number | null,
  protectionFeeEnabled: true,
  protectionFeeRate: 0.03,
  protectionFeeDefault: ProtectionDefaultMode.OPT_IN,
  quoteValidDays: 14,
  invitationExpiryHours: 48,
  autoConfirmDays: 5,
  matchingInviteCount: 3,
  maxReassignments: 6,
  leadCurrency: MONEY_CODE,
  smallBudgetMax: 1000,
  mediumBudgetMax: 10000,
  smallLeadMin: 8,
  smallLeadMax: 12,
  smallLeadDefault: 10,
  mediumLeadMin: 12,
  mediumLeadMax: 25,
  mediumLeadDefault: 18,
  largeLeadMin: 25,
  largeLeadMax: 100,
  largeLeadDefault: 37.5,
  termsVersion: "v1.0",
};

const LEAD_EXAMPLES: Record<JobSize, string> = {
  SMALL: "Roof repair, gutters, small plastering",
  MEDIUM: "Bathroom, kitchen fitting, garage conversion, re-roof part",
  LARGE: "Loft conversion, extension, full kitchen, full new roof",
};

/** Load singleton pricing config, creating defaults if missing. */
export async function getPricingConfig(): Promise<PricingConfig> {
  const existing = await prisma.pricingConfig.findUnique({ where: { key: "default" } });
  if (!existing) {
    return prisma.pricingConfig.create({
      data: {
        key: DEFAULTS.key,
        traderFeeType: DEFAULTS.traderFeeType,
        traderFeeRate: DEFAULTS.traderFeeRate,
        traderFeeCap: DEFAULTS.traderFeeCap,
        protectionFeeEnabled: DEFAULTS.protectionFeeEnabled,
        protectionFeeRate: DEFAULTS.protectionFeeRate,
        protectionFeeDefault: DEFAULTS.protectionFeeDefault,
        quoteValidDays: DEFAULTS.quoteValidDays,
        invitationExpiryHours: DEFAULTS.invitationExpiryHours,
        autoConfirmDays: DEFAULTS.autoConfirmDays,
        matchingInviteCount: DEFAULTS.matchingInviteCount,
        maxReassignments: DEFAULTS.maxReassignments,
        leadCurrency: DEFAULTS.leadCurrency,
        smallBudgetMax: DEFAULTS.smallBudgetMax,
        mediumBudgetMax: DEFAULTS.mediumBudgetMax,
        smallLeadMin: DEFAULTS.smallLeadMin,
        smallLeadMax: DEFAULTS.smallLeadMax,
        smallLeadDefault: DEFAULTS.smallLeadDefault,
        mediumLeadMin: DEFAULTS.mediumLeadMin,
        mediumLeadMax: DEFAULTS.mediumLeadMax,
        mediumLeadDefault: DEFAULTS.mediumLeadDefault,
        largeLeadMin: DEFAULTS.largeLeadMin,
        largeLeadMax: DEFAULTS.largeLeadMax,
        largeLeadDefault: DEFAULTS.largeLeadDefault,
        termsVersion: DEFAULTS.termsVersion,
      },
    });
  }

  // Backfill lead-pricing fields on older config rows (Mongo may omit new defaults).
  const needsBackfill =
    (existing as { smallLeadDefault?: number | null }).smallLeadDefault == null;

  if (needsBackfill) {
    return prisma.pricingConfig.update({
      where: { id: existing.id },
      data: {
        leadCurrency: DEFAULTS.leadCurrency,
        smallBudgetMax: DEFAULTS.smallBudgetMax,
        mediumBudgetMax: DEFAULTS.mediumBudgetMax,
        smallLeadMin: DEFAULTS.smallLeadMin,
        smallLeadMax: DEFAULTS.smallLeadMax,
        smallLeadDefault: DEFAULTS.smallLeadDefault,
        mediumLeadMin: DEFAULTS.mediumLeadMin,
        mediumLeadMax: DEFAULTS.mediumLeadMax,
        mediumLeadDefault: DEFAULTS.mediumLeadDefault,
        largeLeadMin: DEFAULTS.largeLeadMin,
        largeLeadMax: DEFAULTS.largeLeadMax,
        largeLeadDefault: DEFAULTS.largeLeadDefault,
        matchingInviteCount: existing.matchingInviteCount || 3,
        traderFeeType: TraderFeeType.LEAD_BY_SIZE,
      },
    });
  }

  const patch: {
    largeLeadMax?: number;
    leadCurrency?: string;
  } = {};
  // Bump Large lead max £50 → £100 if still on the old default.
  if (existing.largeLeadMax === 50) patch.largeLeadMax = 100;
  // Platform is GBP-only.
  if (existing.leadCurrency !== MONEY_CODE) patch.leadCurrency = MONEY_CODE;

  if (Object.keys(patch).length > 0) {
    return prisma.pricingConfig.update({
      where: { id: existing.id },
      data: patch,
    });
  }

  return existing;
}

function parseOverrides(raw: unknown): Record<string, CategoryOverride> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return raw as Record<string, CategoryOverride>;
}

function resolveRates(config: PricingConfig, category?: string | null) {
  const overrides = parseOverrides(config.categoryOverrides);
  const cat = category ? overrides[category] : undefined;

  return {
    traderFeeType: cat?.traderFeeType ?? config.traderFeeType,
    traderFeeRate: cat?.traderFeeRate ?? config.traderFeeRate,
    traderFeeCap: cat?.traderFeeCap !== undefined ? cat.traderFeeCap : config.traderFeeCap,
    protectionFeeRate: cat?.protectionFeeRate ?? config.protectionFeeRate,
  };
}

/** Always £ — platform is GBP-only. */
export function currencySymbol(_code?: string) {
  return MONEY_SYMBOL;
}

/** Pick job size from budget (uses max when both set). */
export function resolveJobSize(
  budgetMin: number | null | undefined,
  budgetMax: number | null | undefined,
  config: PricingConfig
): JobSize {
  const amount =
    budgetMax != null && Number.isFinite(budgetMax)
      ? budgetMax
      : budgetMin != null && Number.isFinite(budgetMin)
        ? budgetMin
        : null;

  // Unknown budget → treat as MEDIUM (typical home improvement)
  if (amount == null) return JobSize.MEDIUM;

  if (amount < config.smallBudgetMax) return JobSize.SMALL;
  if (amount < config.mediumBudgetMax) return JobSize.MEDIUM;
  return JobSize.LARGE;
}

export function getLeadBand(size: JobSize, config: PricingConfig): LeadBand {
  const sym = MONEY_SYMBOL;
  const maxTraders = config.matchingInviteCount;

  if (size === JobSize.SMALL) {
    return {
      size,
      label: "Small",
      examples: LEAD_EXAMPLES.SMALL,
      budgetLabel: `Under ${sym}${config.smallBudgetMax.toLocaleString("en-GB")}`,
      leadMin: config.smallLeadMin,
      leadMax: config.smallLeadMax,
      leadDefault: config.smallLeadDefault,
      maxTraders,
    };
  }
  if (size === JobSize.MEDIUM) {
    return {
      size,
      label: "Medium",
      examples: LEAD_EXAMPLES.MEDIUM,
      budgetLabel: `${sym}${config.smallBudgetMax.toLocaleString("en-GB")}–${sym}${config.mediumBudgetMax.toLocaleString("en-GB")}`,
      leadMin: config.mediumLeadMin,
      leadMax: config.mediumLeadMax,
      leadDefault: config.mediumLeadDefault,
      maxTraders,
    };
  }
  return {
    size,
    label: "Large",
    examples: LEAD_EXAMPLES.LARGE,
    budgetLabel: `${sym}${config.mediumBudgetMax.toLocaleString("en-GB")}+`,
    leadMin: config.largeLeadMin,
    leadMax: config.largeLeadMax,
    leadDefault: config.largeLeadDefault,
    maxTraders,
  };
}

export function listLeadBands(config: PricingConfig): LeadBand[] {
  return [
    getLeadBand(JobSize.SMALL, config),
    getLeadBand(JobSize.MEDIUM, config),
    getLeadBand(JobSize.LARGE, config),
  ];
}

export function formatLeadPriceRange(band: LeadBand, _config?: PricingConfig) {
  const sym = MONEY_SYMBOL;
  return `${sym}${band.leadMin}–${sym}${band.leadMax}`;
}

/** Server-side only — never trust client amounts. */
export function calcTraderSuccessFee(
  quoteAmount: number,
  config: PricingConfig,
  category?: string | null,
  jobSize?: JobSize | null
): number {
  const amount = Math.max(0, Number(quoteAmount) || 0);
  const rates = resolveRates(config, category);

  if (rates.traderFeeType === TraderFeeType.LEAD_BY_SIZE) {
    const size = jobSize ?? resolveJobSize(amount, amount, config);
    return roundMoney(getLeadBand(size, config).leadDefault);
  }

  let fee =
    rates.traderFeeType === TraderFeeType.FIXED
      ? rates.traderFeeRate
      : amount * rates.traderFeeRate;

  if (rates.traderFeeCap != null && rates.traderFeeCap > 0) {
    fee = Math.min(fee, rates.traderFeeCap);
  }

  return roundMoney(fee);
}

export function calcProtectionFee(
  quoteAmount: number,
  config: PricingConfig,
  category?: string | null
): number {
  if (!config.protectionFeeEnabled) return 0;
  const amount = Math.max(0, Number(quoteAmount) || 0);
  const rates = resolveRates(config, category);
  return roundMoney(amount * rates.protectionFeeRate);
}

export function buildPricePreview(
  quoteAmount: number,
  config: PricingConfig,
  category?: string | null,
  jobSize?: JobSize | null
): PricePreview {
  const quote = roundMoney(Math.max(0, Number(quoteAmount) || 0));
  const size =
    jobSize ??
    (config.traderFeeType === TraderFeeType.LEAD_BY_SIZE
      ? resolveJobSize(quote, quote, config)
      : null);
  const traderSuccessFee = calcTraderSuccessFee(quote, config, category, size);
  const protectionFee = calcProtectionFee(quote, config, category);
  const rates = resolveRates(config, category);
  const leadBand = size ? getLeadBand(size, config) : null;
  const sym = MONEY_SYMBOL;

  let traderFeeLabel: string;
  if (rates.traderFeeType === TraderFeeType.LEAD_BY_SIZE && leadBand) {
    traderFeeLabel = `Lead ${formatLeadPriceRange(leadBand)} (+VAT) · charge ${sym}${leadBand.leadDefault}`;
  } else if (rates.traderFeeType === TraderFeeType.FIXED) {
    traderFeeLabel = `${sym}${rates.traderFeeRate.toLocaleString("en-GB")} fixed`;
  } else {
    traderFeeLabel =
      `${(rates.traderFeeRate * 100).toFixed(1)}%` +
      (rates.traderFeeCap != null
        ? ` (cap ${sym}${rates.traderFeeCap.toLocaleString("en-GB")})`
        : "");
  }

  return {
    quoteAmount: quote,
    traderSuccessFee,
    protectionFee,
    customerTotalProtected: roundMoney(quote + protectionFee),
    customerTotalUnprotected: quote,
    protectionFeeRate: rates.protectionFeeRate,
    traderFeeLabel,
    protectionEnabled: config.protectionFeeEnabled,
    protectionDefault: config.protectionFeeDefault,
    termsVersion: config.termsVersion,
    jobSize: size,
    leadBand,
  };
}

export function roundMoney(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
