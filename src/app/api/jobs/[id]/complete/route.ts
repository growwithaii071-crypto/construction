import { NextResponse } from "next/server";
import { completeJobAction } from "@/actions/marketplace/lifecycle";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const result = await completeJobAction(id);
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}
