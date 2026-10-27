import { NextRequest, NextResponse } from "next/server";
import { declineInvitationAction } from "@/actions/marketplace/jobs";

/** POST /api/jobs/:id/invitations/:iid/decline */
export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string; iid: string }> }
) {
  const { iid } = await ctx.params;
  const result = await declineInvitationAction(iid);
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}
