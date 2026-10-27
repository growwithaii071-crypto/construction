import { NextResponse } from "next/server";
import { startJobAction } from "@/actions/marketplace/lifecycle";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const result = await startJobAction(id);
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}
