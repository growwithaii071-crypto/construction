import { NextRequest, NextResponse } from "next/server";
import { runMarketplaceMaintenance } from "@/lib/marketplace-cron";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Vercel Cron / external scheduler.
 * Auth: Authorization: Bearer $CRON_SECRET  OR  ?secret=$CRON_SECRET
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 503 }
    );
  }

  const auth = req.headers.get("authorization")?.trim() ?? "";
  const bearer = auth.toLowerCase().startsWith("bearer ")
    ? auth.slice(7).trim()
    : "";
  const querySecret = req.nextUrl.searchParams.get("secret")?.trim() ?? "";

  if (bearer !== secret && querySecret !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runMarketplaceMaintenance();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[CRON_MARKETPLACE]", err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Cron failed",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
