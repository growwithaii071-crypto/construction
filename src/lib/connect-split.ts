import { calcCommission } from "@/lib/trader-billing";
import { toStripeAmount, fromStripeAmount, formatMoney } from "@/lib/money";
import type { PricingConfig } from "@/generated/prisma";

export type ConnectSplit = {
  /** Total charged to homeowner (pence) */
  chargePence: number;
  /** Platform commission kept via application_fee (pence) */
  applicationFeePence: number;
  /** Amount that lands on trader Connect account (pence) */
  traderPence: number;
  charge: number;
  applicationFee: number;
  traderNet: number;
  rate: number;
  label: string;
  takesCommission: boolean;
};

type SplitConfig = Pick<PricingConfig, "commissionRate" | "commissionMin" | "commissionMax">;

/**
 * Build Connect destination-charge split for a charge amount.
 * When takeCommission=false (later installments), application_fee is 0.
 * When takeCommission=true, fee is min(fullDealCommission, charge - 0.01).
 */
export function buildConnectSplit(
  chargeAmount: number,
  config: SplitConfig,
  opts?: {
    takeCommission?: boolean;
    /** Full agreed quote — used to size platform commission (first payment only) */
    dealTotal?: number;
  }
): ConnectSplit {
  const charge = Math.max(0, Number(chargeAmount) || 0);
  const rate = config.commissionRate ?? 0.08;
  const takeCommission = opts?.takeCommission !== false;
  const dealTotal =
    opts?.dealTotal != null && opts.dealTotal > 0 ? opts.dealTotal : charge;

  let applicationFee = 0;
  if (takeCommission && charge > 0) {
    const fullFee = calcCommission(dealTotal, config);
    // Stripe requires application_fee < charge
    applicationFee = Math.min(fullFee, Math.max(0, charge - 0.01));
  }

  const fee = Math.round((applicationFee + Number.EPSILON) * 100) / 100;
  const traderNet = Math.max(0, Math.round((charge - fee) * 100) / 100);

  return {
    chargePence: toStripeAmount(charge),
    applicationFeePence: toStripeAmount(fee),
    traderPence: toStripeAmount(traderNet),
    charge,
    applicationFee: fee,
    traderNet,
    rate,
    takesCommission: fee > 0,
    label:
      fee > 0
        ? `${formatMoney(fee)} platform (${(rate * 100).toFixed(0)}%) · ${formatMoney(traderNet)} to trader`
        : `${formatMoney(charge)} to trader (no platform fee on this installment)`,
  };
}

export function splitFromPence(chargePence: number, feePence: number) {
  return {
    charge: fromStripeAmount(chargePence),
    applicationFee: fromStripeAmount(feePence),
    traderNet: fromStripeAmount(Math.max(0, chargePence - feePence)),
  };
}
