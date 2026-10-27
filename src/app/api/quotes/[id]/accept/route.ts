import { NextRequest, NextResponse } from "next/server";
import { acceptQuoteAction } from "@/actions/marketplace/quotes";

/** POST /api/quotes/:id/accept  body: { protection: true | false } */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  const fd = new FormData();
  fd.set("quoteId", id);
  fd.set("protection", body.protection === true || body.protection === "true" ? "true" : "false");
  if (body.confirmExpired) fd.set("confirmExpired", "true");

  const result = await acceptQuoteAction(fd);
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}
