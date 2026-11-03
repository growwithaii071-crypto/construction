/**
 * Canonical public site URL (no trailing slash).
 * Order: NEXT_PUBLIC_APP_URL (if not localhost-on-Vercel) → VERCEL_URL → localhost.
 */
export function getAppUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ?? "";
  const vercel = process.env.VERCEL_URL?.trim();

  const vercelUrl = vercel
    ? `https://${vercel.replace(/^https?:\/\//, "").replace(/\/$/, "")}`
    : "";

  // Misconfigured deploy: APP_URL left as localhost while running on Vercel
  if (explicit && !(vercelUrl && /localhost|127\.0\.0\.1/i.test(explicit))) {
    return explicit;
  }

  if (vercelUrl) return vercelUrl;

  return explicit || "http://localhost:3000";
}
