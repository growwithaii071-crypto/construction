/**
 * Canonical public site URL (no trailing slash).
 * Order:
 * 1. NEXT_PUBLIC_APP_URL (unless left as localhost on a Vercel deploy)
 * 2. VERCEL_PROJECT_PRODUCTION_URL (stable production host — preferred over ephemeral VERCEL_URL)
 * 3. VERCEL_URL (deployment-specific)
 * 4. localhost
 */
export function getAppUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ?? "";
  const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  const vercelHost = process.env.VERCEL_URL?.trim();

  const productionUrl = productionHost
    ? `https://${productionHost.replace(/^https?:\/\//, "").replace(/\/$/, "")}`
    : "";
  const vercelUrl = vercelHost
    ? `https://${vercelHost.replace(/^https?:\/\//, "").replace(/\/$/, "")}`
    : "";

  const onVercel = Boolean(productionUrl || vercelUrl);

  // Misconfigured deploy: APP_URL left as localhost while running on Vercel
  if (explicit && !(onVercel && /localhost|127\.0\.0\.1/i.test(explicit))) {
    return explicit;
  }

  // Prefer the stable production domain over a per-deployment *.vercel.app URL
  // (those often have Deployment Protection → Vercel login after Stripe redirects).
  if (productionUrl) return productionUrl;
  if (vercelUrl) return vercelUrl;

  return explicit || "http://localhost:3000";
}

/**
 * Append Vercel Deployment Protection bypass params so Stripe (and similar)
 * redirects are not blocked by the Vercel Authentication wall.
 *
 * Enable in Vercel → Deployment Protection → Protection Bypass for Automation.
 * Secret is exposed as VERCEL_AUTOMATION_BYPASS_SECRET.
 */
export function withVercelProtectionBypass(url: string): string {
  const secret =
    process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim() ||
    process.env.VERCEL_PROTECTION_BYPASS?.trim() ||
    "";
  if (!secret) return url;

  try {
    const u = new URL(url);
    u.searchParams.set("x-vercel-protection-bypass", secret);
    u.searchParams.set("x-vercel-set-bypass-cookie", "true");
    return u.toString();
  } catch {
    const join = url.includes("?") ? "&" : "?";
    return `${url}${join}x-vercel-protection-bypass=${encodeURIComponent(secret)}&x-vercel-set-bypass-cookie=true`;
  }
}
