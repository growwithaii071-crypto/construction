import { describe, expect, it } from "vitest";
import {
  buildPricePreview,
  calcProtectionFee,
  calcTraderSuccessFee,
  roundMoney,
} from "./pricing";
import {
  TraderFeeType,
  ProtectionDefaultMode,
  UnprotectedReleaseTiming,
  type PricingConfig,
} from "@/generated/prisma";

function cfg(partial: Partial<PricingConfig> = {}): PricingConfig {
  return {
    id: "1",
    key: "default",
    traderFeeType: TraderFeeType.PERCENTAGE,
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
    categoryOverrides: null,
    termsVersion: "v1.0",
    updatedById: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...partial,
  };
}

describe("pricing calculator", () => {
  it("calculates percentage trader fee", () => {
    expect(calcTraderSuccessFee(50000, cfg())).toBe(5000);
  });

  it("applies trader fee cap", () => {
    expect(calcTraderSuccessFee(50000, cfg({ traderFeeCap: 2000 }))).toBe(2000);
  });

  it("calculates fixed trader fee", () => {
    expect(
      calcTraderSuccessFee(50000, cfg({ traderFeeType: TraderFeeType.FIXED, traderFeeRate: 750 }))
    ).toBe(750);
  });

  it("calculates protection fee", () => {
    expect(calcProtectionFee(50000, cfg())).toBe(1500);
  });

  it("returns 0 protection when disabled", () => {
    expect(calcProtectionFee(50000, cfg({ protectionFeeEnabled: false }))).toBe(0);
  });

  it("builds side-by-side preview totals", () => {
    const preview = buildPricePreview(50000, cfg());
    expect(preview.customerTotalUnprotected).toBe(50000);
    expect(preview.customerTotalProtected).toBe(51500);
    expect(preview.traderSuccessFee).toBe(5000);
  });

  it("ignores negative quote amounts", () => {
    expect(buildPricePreview(-100, cfg()).quoteAmount).toBe(0);
  });

  it("rounds money to 2 decimals", () => {
    expect(roundMoney(10.005)).toBe(10.01);
  });
});
