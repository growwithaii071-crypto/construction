/** Single platform currency — GBP only. */
export const MONEY_SYMBOL = "£";
export const MONEY_CODE = "GBP";
export const MONEY_LOCALE = "en-GB";
export const STRIPE_CURRENCY = "gbp";

/** Format for UI / notifications / emails: £1,234.56 */
export function formatMoney(amount: number | null | undefined) {
  const n = Number(amount) || 0;
  return `${MONEY_SYMBOL}${n.toLocaleString(MONEY_LOCALE, {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Stripe expects integer amount in smallest currency unit (pence for GBP). */
export function toStripeAmount(pounds: number) {
  return Math.round(pounds * 100);
}

export function fromStripeAmount(pence: number) {
  return Math.round(pence) / 100;
}
