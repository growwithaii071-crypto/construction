import { NextResponse } from "next/server";
import { getQuotePricePreviewAction } from "@/actions/marketplace/quotes";

/** GET /api/quotes/:id/price-preview */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const result = await getQuotePricePreviewAction(id);
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}
