import prisma from "@/lib/prisma";
import {
  TraderFeeType,
  ProtectionDefaultMode,
  type PricingConfig,
} from "@/generated/prisma";

export type CategoryOverride = {
  traderFeeType?: TraderFeeType;
  traderFeeRate?: number;
  traderFeeCap?: number | null;
  protectionFeeRate?: number;
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
};

const DEFAULTS = {
  key: "default",
  traderFeeType: TraderFeeType.PERCENTAGE,
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
  termsVersion: "v1.0",
};

/** Load singleton pricing config, creating defaults if missing. */
export async function getPricingConfig(): Promise<PricingConfig> {
  const existing = await prisma.pricingConfig.findUnique({ where: { key: "default" } });
  if (existing) return existing;

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
      termsVersion: DEFAULTS.termsVersion,
    },
  });
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

/** Server-side only — never trust client amounts. */
export function calcTraderSuccessFee(
  quoteAmount: number,
  config: PricingConfig,
  category?: string | null
): number {
  const amount = Math.max(0, Number(quoteAmount) || 0);
  const rates = resolveRates(config, category);

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
  category?: string | null
): PricePreview {
  const quote = roundMoney(Math.max(0, Number(quoteAmount) || 0));
  const traderSuccessFee = calcTraderSuccessFee(quote, config, category);
  const protectionFee = calcProtectionFee(quote, config, category);
  const rates = resolveRates(config, category);

  const traderFeeLabel =
    rates.traderFeeType === TraderFeeType.FIXED
      ? `₹${rates.traderFeeRate.toLocaleString("en-IN")} fixed`
      : `${(rates.traderFeeRate * 100).toFixed(1)}%` +
        (rates.traderFeeCap != null ? ` (cap ₹${rates.traderFeeCap.toLocaleString("en-IN")})` : "");

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
  };
}

export function roundMoney(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
