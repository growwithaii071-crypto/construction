import { describe, expect, it } from "vitest";
import {
  buildPricePreview,
  calcProtectionFee,
  calcTraderSuccessFee,
  resolveJobSize,
  getLeadBand,
  roundMoney,
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
    mediumLeadDefault: 18,
    largeLeadMin: 25,
    largeLeadMax: 100,
    largeLeadDefault: 37.5,
    categoryOverrides: null,
    termsVersion: "v1.0",
    updatedById: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...partial,
  };
}

describe("lead pricing by job size", () => {
  it("resolves small / medium / large from budget", () => {
    expect(resolveJobSize(null, 500, cfg())).toBe(JobSize.SMALL);
    expect(resolveJobSize(2000, 5000, cfg())).toBe(JobSize.MEDIUM);
    expect(resolveJobSize(null, 15000, cfg())).toBe(JobSize.LARGE);
  });

  it("charges lead default for each size", () => {
    expect(calcTraderSuccessFee(800, cfg(), null, JobSize.SMALL)).toBe(10);
    expect(calcTraderSuccessFee(5000, cfg(), null, JobSize.MEDIUM)).toBe(18);
    expect(calcTraderSuccessFee(20000, cfg(), null, JobSize.LARGE)).toBe(37.5);
  });

  it("exposes lead band range and max traders = 3", () => {
    const band = getLeadBand(JobSize.MEDIUM, cfg());
    expect(band.leadMin).toBe(12);
    expect(band.leadMax).toBe(25);
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

  it("builds preview with lead fee for medium quote", () => {
    const preview = buildPricePreview(5000, cfg(), null, JobSize.MEDIUM);
    expect(preview.customerTotalUnprotected).toBe(5000);
    expect(preview.traderSuccessFee).toBe(18);
    expect(preview.jobSize).toBe(JobSize.MEDIUM);
  });

  it("ignores negative quote amounts", () => {
    expect(buildPricePreview(-100, cfg()).quoteAmount).toBe(0);
  });

  it("rounds money to 2 decimals", () => {
    expect(roundMoney(10.005)).toBe(10.01);
  });
});
