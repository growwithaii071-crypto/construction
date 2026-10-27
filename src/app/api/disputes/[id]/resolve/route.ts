import { NextResponse } from "next/server";
import { resolveDisputeAction } from "@/actions/marketplace/disputes";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  let body: {
    resolution?: string;
    notes?: string;
    traderAmount?: number | string;
  } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { success: false, message: "JSON body required" },
      { status: 400 }
    );
  }

  const fd = new FormData();
  fd.set("disputeId", id);
  fd.set("resolution", body.resolution ?? "");
  if (body.notes) fd.set("notes", body.notes);
  if (body.traderAmount != null) fd.set("traderAmount", String(body.traderAmount));

  const result = await resolveDisputeAction(fd);
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}
