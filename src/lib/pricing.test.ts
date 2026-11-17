import { describe, expect, it } from "vitest";
import {
  buildPricePreview,
  calcProtectionFee,
  calcTraderSuccessFee,
  calcSuccessFeeFromTiers,
  resolveJobSize,
  getLeadBand,
  listSuccessFeeTiers,
  roundMoney,
  DEFAULT_SUCCESS_FEE_TIERS,
} from "./pricing";
import {
  TraderFeeType,
  ProtectionDefaultMode,
  UnprotectedReleaseTiming,
  JobSize,
  type PricingConfig,
} from "@/generated/prisma";

function cfg(partial: Partial<PricingConfig> = {}): PricingConfig {
  return {
    id: "1",
    key: "default",
    traderFeeType: TraderFeeType.LEAD_BY_SIZE,
    traderFeeRate: 0.1,
    traderFeeCap: null,
    protectionFeeEnabled: true,
    protectionFeeRate: 0.03,
    protectionFeeDefault: ProtectionDefaultMode.OPT_IN,
    unprotectedReleaseAt: UnprotectedReleaseTiming.JOB_START,
    quoteValidDays: 14,
    invitationExpiryHours: 48,
    autoConfirmDays: 5,
    matchingInviteCount: 3,
    maxReassignments: 6,
    leadCurrency: "GBP",
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
    commissionMax: null,
    creditPackPrice: 25,
    creditPackSize: 5,
    subscriptionPrice: 49,
    subscriptionDays: 30,
    categoryOverrides: null,
    termsVersion: "v1.0",
    updatedById: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...partial,
  };
}

describe("success fee by job value", () => {
  it("uses the default 5-band table", () => {
    expect(listSuccessFeeTiers(cfg())).toEqual(DEFAULT_SUCCESS_FEE_TIERS);
    expect(calcSuccessFeeFromTiers(1, DEFAULT_SUCCESS_FEE_TIERS)).toBe(10);
    expect(calcSuccessFeeFromTiers(1000, DEFAULT_SUCCESS_FEE_TIERS)).toBe(10);
    expect(calcSuccessFeeFromTiers(1001, DEFAULT_SUCCESS_FEE_TIERS)).toBe(25);
    expect(calcSuccessFeeFromTiers(5000, DEFAULT_SUCCESS_FEE_TIERS)).toBe(25);
    expect(calcSuccessFeeFromTiers(5001, DEFAULT_SUCCESS_FEE_TIERS)).toBe(50);
    expect(calcSuccessFeeFromTiers(10000, DEFAULT_SUCCESS_FEE_TIERS)).toBe(50);
    expect(calcSuccessFeeFromTiers(10001, DEFAULT_SUCCESS_FEE_TIERS)).toBe(100);
    expect(calcSuccessFeeFromTiers(25000, DEFAULT_SUCCESS_FEE_TIERS)).toBe(100);
    expect(calcSuccessFeeFromTiers(25001, DEFAULT_SUCCESS_FEE_TIERS)).toBe(250);
    expect(calcSuccessFeeFromTiers(100000, DEFAULT_SUCCESS_FEE_TIERS)).toBe(250);
  });

  it("charges success fee from quote amount (ignores job size label)", () => {
    expect(calcTraderSuccessFee(800, cfg())).toBe(10);
    expect(calcTraderSuccessFee(5000, cfg())).toBe(25);
    expect(calcTraderSuccessFee(7500, cfg())).toBe(50);
    expect(calcTraderSuccessFee(20000, cfg())).toBe(100);
    expect(calcTraderSuccessFee(40000, cfg())).toBe(250);
  });

  it("still resolves small / medium / large labels from budget", () => {
    expect(resolveJobSize(null, 500, cfg())).toBe(JobSize.SMALL);
    expect(resolveJobSize(2000, 5000, cfg())).toBe(JobSize.MEDIUM);
    expect(resolveJobSize(null, 15000, cfg())).toBe(JobSize.LARGE);
  });

  it("maps lead band display fee from tiers", () => {
    const band = getLeadBand(JobSize.MEDIUM, cfg());
    expect(band.leadDefault).toBe(25);
    expect(band.maxTraders).toBe(3);
  });
});

describe("legacy percentage / fixed fees", () => {
  it("calculates percentage trader fee", () => {
    expect(
      calcTraderSuccessFee(50000, cfg({ traderFeeType: TraderFeeType.PERCENTAGE }))
    ).toBe(5000);
  });

  it("applies trader fee cap", () => {
    expect(
      calcTraderSuccessFee(
        50000,
        cfg({ traderFeeType: TraderFeeType.PERCENTAGE, traderFeeCap: 2000 })
      )
    ).toBe(2000);
  });

  it("calculates fixed trader fee", () => {
    expect(
      calcTraderSuccessFee(
        50000,
        cfg({ traderFeeType: TraderFeeType.FIXED, traderFeeRate: 750 })
      )
    ).toBe(750);
  });
});

describe("pricing calculator", () => {
  it("calculates protection fee", () => {
    expect(calcProtectionFee(50000, cfg())).toBe(1500);
  });

  it("returns 0 protection when disabled", () => {
    expect(calcProtectionFee(50000, cfg({ protectionFeeEnabled: false }))).toBe(0);
  });

  it("builds preview with success fee for £5,000 quote", () => {
    const preview = buildPricePreview(5000, cfg());
    expect(preview.customerTotalUnprotected).toBe(5000);
    expect(preview.traderSuccessFee).toBe(25);
  });

  it("ignores negative quote amounts", () => {
    expect(buildPricePreview(-100, cfg()).quoteAmount).toBe(0);
  });

  it("rounds money to 2 decimals", () => {
    expect(roundMoney(10.005)).toBe(10.01);
  });
});
