import { z } from "zod";

/** UK postcode (full), e.g. SW1A 1AA, M1 1AE, EC1A 1BB */
const UK_POSTCODE_REGEX = /^([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})$/i;

export function isValidUkPostcode(raw: string): boolean {
  return UK_POSTCODE_REGEX.test(String(raw ?? "").trim());
}

/** Normalise to uppercase with a single space before the inward code: "sw1a1aa" → "SW1A 1AA" */
export function normalizeUkPostcode(raw: string): string {
  const compact = String(raw ?? "")
    .replace(/\s+/g, "")
    .toUpperCase();
  if (compact.length < 5) return compact;
  return `${compact.slice(0, -3)} ${compact.slice(-3)}`;
}

/** Outward code only (area + district), e.g. "SW1A" from "SW1A 1AA" */
export function ukPostcodeOutward(raw: string): string {
  const normalized = normalizeUkPostcode(raw);
  const match = normalized.match(UK_POSTCODE_REGEX);
  return match?.[1]?.toUpperCase() ?? normalized.split(" ")[0] ?? "";
}

export function postcodesMatch(a: string, b: string): boolean {
  if (!a?.trim() || !b?.trim()) return false;
  const na = normalizeUkPostcode(a);
  const nb = normalizeUkPostcode(b);
  if (na === nb) return true;
  // Also match on outward code so "SW1A" finds "SW1A 1AA"
  return ukPostcodeOutward(na) === ukPostcodeOutward(nb);
}

export const ukPostcodeSchema = z
  .string({ message: "Postcode is required." })
  .trim()
  .min(1, "Postcode is required.")
  .refine(isValidUkPostcode, {
    message: "Enter a valid UK postcode (e.g. SW1A 1AA).",
  })
  .transform(normalizeUkPostcode);
