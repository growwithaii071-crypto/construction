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
};

/** Build Connect destination-charge split from quote + PricingConfig.commissionRate. */
export function buildConnectSplit(
  quoteAmount: number,
  config: Pick<PricingConfig, "commissionRate" | "commissionMin" | "commissionMax">
): ConnectSplit {
  const charge = Math.max(0, Number(quoteAmount) || 0);
  const rate = config.commissionRate ?? 0.08;
  const applicationFee = calcCommission(charge, config);
  // Stripe requires application_fee < charge
  const fee = Math.min(applicationFee, Math.max(0, charge - 0.01));
  const traderNet = Math.max(0, Math.round((charge - fee) * 100) / 100);

  return {
    chargePence: toStripeAmount(charge),
    applicationFeePence: toStripeAmount(fee),
    traderPence: toStripeAmount(traderNet),
    charge,
    applicationFee: fee,
    traderNet,
    rate,
    label: `${formatMoney(fee)} platform (${(rate * 100).toFixed(0)}%) · ${formatMoney(traderNet)} to trader`,
  };
}

export function splitFromPence(chargePence: number, feePence: number) {
  return {
    charge: fromStripeAmount(chargePence),
    applicationFee: fromStripeAmount(feePence),
    traderNet: fromStripeAmount(Math.max(0, chargePence - feePence)),
  };
}
