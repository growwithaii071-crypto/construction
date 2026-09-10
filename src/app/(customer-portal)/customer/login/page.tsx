import { redirect } from "next/navigation";

/** Legacy URL — all logins now use the unified /login page */
export default async function CustomerLoginRedirect({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const params = await searchParams;
  const q = new URLSearchParams();
  if (params.callbackUrl) q.set("callbackUrl", params.callbackUrl);
  if (params.error) q.set("error", params.error);
  const qs = q.toString();
  redirect(qs ? `/login?${qs}` : "/login");
}
