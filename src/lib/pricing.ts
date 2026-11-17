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

/** One band in the Job Value → Success Fee table. max = null means open-ended. */
export type SuccessFeeTier = {
  min: number;
  max: number | null;
  fee: number;
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
  successFeeTier?: SuccessFeeTier | null;
};

/** Default trader success fee by job value (GBP). */
export const DEFAULT_SUCCESS_FEE_TIERS: SuccessFeeTier[] = [
  { min: 1, max: 1000, fee: 10 },
  { min: 1001, max: 5000, fee: 25 },
  { min: 5001, max: 10000, fee: 50 },
  { min: 10001, max: 25000, fee: 100 },
  { min: 25001, max: null, fee: 250 },
];

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
  mediumLeadDefault: 25,
  largeLeadMin: 25,
  largeLeadMax: 100,
  largeLeadDefault: 100,
  successFeeTiers: DEFAULT_SUCCESS_FEE_TIERS,
  commissionRate: 0.08,
  commissionMin: 0,
  commissionMax: null as number | null,
  creditPackPrice: 25,
  creditPackSize: 5,
  subscriptionPrice: 49,
  subscriptionDays: 30,
  termsVersion: "v1.0",
};

const LEAD_EXAMPLES: Record<JobSize, string> = {
  SMALL: "Roof repair, gutters, small plastering",
  MEDIUM: "Bathroom, kitchen fitting, garage conversion, re-roof part",
  LARGE: "Loft conversion, extension, full kitchen, full new roof",
};

export function parseSuccessFeeTiers(raw: unknown): SuccessFeeTier[] {
  if (!Array.isArray(raw) || raw.length === 0) return DEFAULT_SUCCESS_FEE_TIERS;

  const parsed: SuccessFeeTier[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const min = Number(r.min);
    const fee = Number(r.fee);
    const maxRaw = r.max;
    const max =
      maxRaw === null || maxRaw === undefined || maxRaw === ""
        ? null
        : Number(maxRaw);
    if (!Number.isFinite(min) || !Number.isFinite(fee) || fee < 0) continue;
    if (max != null && (!Number.isFinite(max) || max < min)) continue;
    parsed.push({ min, max, fee: roundMoney(fee) });
  }

  return parsed.length > 0 ? parsed : DEFAULT_SUCCESS_FEE_TIERS;
}

export function listSuccessFeeTiers(config: PricingConfig): SuccessFeeTier[] {
  return parseSuccessFeeTiers(config.successFeeTiers);
}

export function formatSuccessFeeBand(tier: SuccessFeeTier): string {
  const sym = MONEY_SYMBOL;
  const min = `${sym}${tier.min.toLocaleString("en-GB")}`;
  if (tier.max == null) return `${min}+`;
  return `${min} – ${sym}${tier.max.toLocaleString("en-GB")}`;
}

/** Pick success fee for a job/quote value. */
export function calcSuccessFeeFromTiers(
  jobValue: number,
  tiers: SuccessFeeTier[]
): number {
  const amount = Math.max(0, Number(jobValue) || 0);
  if (amount <= 0) return 0;

  const sorted = [...tiers].sort((a, b) => a.min - b.min);
  for (const tier of sorted) {
    if (amount < tier.min) continue;
    if (tier.max == null || amount <= tier.max) return roundMoney(tier.fee);
  }
  return roundMoney(sorted[sorted.length - 1]?.fee ?? 0);
}

export function findSuccessFeeTier(
  jobValue: number,
  tiers: SuccessFeeTier[]
): SuccessFeeTier | null {
  const amount = Math.max(0, Number(jobValue) || 0);
  if (amount <= 0) return null;
  const sorted = [...tiers].sort((a, b) => a.min - b.min);
  for (const tier of sorted) {
    if (amount < tier.min) continue;
    if (tier.max == null || amount <= tier.max) return tier;
  }
  return sorted[sorted.length - 1] ?? null;
}

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
        successFeeTiers: DEFAULTS.successFeeTiers,
        commissionRate: DEFAULTS.commissionRate,
        commissionMin: DEFAULTS.commissionMin,
        commissionMax: DEFAULTS.commissionMax,
        creditPackPrice: DEFAULTS.creditPackPrice,
        creditPackSize: DEFAULTS.creditPackSize,
        subscriptionPrice: DEFAULTS.subscriptionPrice,
        subscriptionDays: DEFAULTS.subscriptionDays,
        termsVersion: DEFAULTS.termsVersion,
      },
    });
  }

  const needsLeadBackfill =
    (existing as { smallLeadDefault?: number | null }).smallLeadDefault == null;

  if (needsLeadBackfill) {
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
        successFeeTiers: DEFAULTS.successFeeTiers,
        matchingInviteCount: existing.matchingInviteCount || 3,
        traderFeeType: TraderFeeType.LEAD_BY_SIZE,
        commissionRate: DEFAULTS.commissionRate,
        commissionMin: DEFAULTS.commissionMin,
        creditPackPrice: DEFAULTS.creditPackPrice,
        creditPackSize: DEFAULTS.creditPackSize,
        subscriptionPrice: DEFAULTS.subscriptionPrice,
        subscriptionDays: DEFAULTS.subscriptionDays,
      },
    });
  }

  const patch: {
    largeLeadMax?: number;
    leadCurrency?: string;
    commissionRate?: number;
    creditPackPrice?: number;
    creditPackSize?: number;
    subscriptionPrice?: number;
    subscriptionDays?: number;
    successFeeTiers?: SuccessFeeTier[];
    traderFeeType?: TraderFeeType;
    mediumLeadDefault?: number;
    largeLeadDefault?: number;
  } = {};

  if (existing.largeLeadMax === 50) patch.largeLeadMax = 100;
  if (existing.leadCurrency !== MONEY_CODE) patch.leadCurrency = MONEY_CODE;
  if ((existing as { commissionRate?: number | null }).commissionRate == null) {
    patch.commissionRate = DEFAULTS.commissionRate;
    patch.creditPackPrice = DEFAULTS.creditPackPrice;
    patch.creditPackSize = DEFAULTS.creditPackSize;
    patch.subscriptionPrice = DEFAULTS.subscriptionPrice;
    patch.subscriptionDays = DEFAULTS.subscriptionDays;
  }
  if (existing.successFeeTiers == null) {
    patch.successFeeTiers = DEFAULT_SUCCESS_FEE_TIERS;
    patch.mediumLeadDefault = 25;
    patch.largeLeadDefault = 100;
  }
  // Always charge success fee from the job-value table (not % / fixed)
  if (existing.traderFeeType !== TraderFeeType.LEAD_BY_SIZE) {
    patch.traderFeeType = TraderFeeType.LEAD_BY_SIZE;
  }

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

/** Pick job size from budget (uses max when both set). Still 3-way for matching UI. */
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

  if (amount == null) return JobSize.MEDIUM;

  if (amount < config.smallBudgetMax) return JobSize.SMALL;
  if (amount < config.mediumBudgetMax) return JobSize.MEDIUM;
  return JobSize.LARGE;
}

export function getLeadBand(size: JobSize, config: PricingConfig): LeadBand {
  const sym = MONEY_SYMBOL;
  const maxTraders = config.matchingInviteCount;
  const tiers = listSuccessFeeTiers(config);

  // Representative value inside each legacy size → success fee from tiers
  const sample =
    size === JobSize.SMALL
      ? Math.max(1, config.smallBudgetMax - 1)
      : size === JobSize.MEDIUM
        ? Math.max(config.smallBudgetMax, Math.min(config.mediumBudgetMax - 1, 5000))
        : Math.max(config.mediumBudgetMax, 15000);
  const fee = calcSuccessFeeFromTiers(sample, tiers);

  if (size === JobSize.SMALL) {
    return {
      size,
      label: "Small",
      examples: LEAD_EXAMPLES.SMALL,
      budgetLabel: `Under ${sym}${config.smallBudgetMax.toLocaleString("en-GB")}`,
      leadMin: fee,
      leadMax: fee,
      leadDefault: fee,
      maxTraders,
    };
  }
  if (size === JobSize.MEDIUM) {
    return {
      size,
      label: "Medium",
      examples: LEAD_EXAMPLES.MEDIUM,
      budgetLabel: `${sym}${config.smallBudgetMax.toLocaleString("en-GB")}–${sym}${config.mediumBudgetMax.toLocaleString("en-GB")}`,
      leadMin: fee,
      leadMax: fee,
      leadDefault: fee,
      maxTraders,
    };
  }
  return {
    size,
    label: "Large",
    examples: LEAD_EXAMPLES.LARGE,
    budgetLabel: `${sym}${config.mediumBudgetMax.toLocaleString("en-GB")}+`,
    leadMin: fee,
    leadMax: fee,
    leadDefault: fee,
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
  if (band.leadMin === band.leadMax) return `${sym}${band.leadDefault}`;
  return `${sym}${band.leadMin}–${sym}${band.leadMax}`;
}

/** Server-side only — never trust client amounts. */
export function calcTraderSuccessFee(
  quoteAmount: number,
  config: PricingConfig,
  category?: string | null,
  _jobSize?: JobSize | null
): number {
  const amount = Math.max(0, Number(quoteAmount) || 0);
  const rates = resolveRates(config, category);

  if (rates.traderFeeType === TraderFeeType.LEAD_BY_SIZE) {
    return calcSuccessFeeFromTiers(amount, listSuccessFeeTiers(config));
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
  const tiers = listSuccessFeeTiers(config);
  const successFeeTier = findSuccessFeeTier(quote, tiers);
  const traderSuccessFee = calcTraderSuccessFee(quote, config, category, size);
  const protectionFee = calcProtectionFee(quote, config, category);
  const rates = resolveRates(config, category);
  const leadBand = size ? getLeadBand(size, config) : null;
  const sym = MONEY_SYMBOL;

  let traderFeeLabel: string;
  if (rates.traderFeeType === TraderFeeType.LEAD_BY_SIZE && successFeeTier) {
    traderFeeLabel = `Success fee ${sym}${successFeeTier.fee} · job ${formatSuccessFeeBand(successFeeTier)}`;
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
    successFeeTier,
  };
}

export function roundMoney(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
