/**
 * Canonical public site URL (no trailing slash).
 * Order:
 * 1. APP_URL (server-only — preferred on Vercel; no NEXT_PUBLIC_ prefix)
 * 2. NEXT_PUBLIC_APP_URL (legacy; unless left as localhost on a Vercel deploy)
 * 3. VERCEL_PROJECT_PRODUCTION_URL (stable production host)
 * 4. VERCEL_URL (deployment-specific)
 * 5. localhost
 */
export function getAppUrl(): string {
  const appUrl = process.env.APP_URL?.trim().replace(/\/$/, "") ?? "";
  const publicAppUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ?? "";
  const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  const vercelHost = process.env.VERCEL_URL?.trim();

  const productionUrl = productionHost
    ? `https://${productionHost.replace(/^https?:\/\//, "").replace(/\/$/, "")}`
    : "";
  const vercelUrl = vercelHost
    ? `https://${vercelHost.replace(/^https?:\/\//, "").replace(/\/$/, "")}`
    : "";

  const onVercel = Boolean(productionUrl || vercelUrl);
  const isLocalhost = (u: string) => /localhost|127\.0\.0\.1/i.test(u);

  // Prefer server-only APP_URL (safe as Vercel Config or Sensitive — no public prefix)
  if (appUrl && !(onVercel && isLocalhost(appUrl))) {
    return appUrl;
  }

  // Legacy NEXT_PUBLIC_APP_URL
  if (publicAppUrl && !(onVercel && isLocalhost(publicAppUrl))) {
    return publicAppUrl;
  }

  // Prefer the stable production domain over a per-deployment *.vercel.app URL
  // (those often have Deployment Protection → Vercel login after Stripe redirects).
  if (productionUrl) return productionUrl;
  if (vercelUrl) return vercelUrl;

  return appUrl || publicAppUrl || "http://localhost:3000";
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
