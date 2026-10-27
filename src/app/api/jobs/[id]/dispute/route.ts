import { NextResponse } from "next/server";
import { raiseDisputeAction } from "@/actions/marketplace/disputes";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  let reason = "";
  try {
    const body = (await req.json()) as { reason?: string };
    reason = body.reason ?? "";
  } catch {
    return NextResponse.json(
      { success: false, message: "JSON body with reason required" },
      { status: 400 }
    );
  }

  const fd = new FormData();
  fd.set("jobId", id);
  fd.set("reason", reason);
  const result = await raiseDisputeAction(fd);
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}
