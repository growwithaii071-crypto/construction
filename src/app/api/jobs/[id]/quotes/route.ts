import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { UserRole } from "@/generated/prisma";
import prisma from "@/lib/prisma";
import { submitQuoteAction } from "@/actions/marketplace/quotes";

/** POST /api/jobs/:id/quotes — trader submits quote (no charge) */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== UserRole.CONTRACTOR) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const { id: jobId } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  const invitation = await prisma.jobInvitation.findFirst({
    where: {
      jobId,
      traderId: session.user.id,
      status: { in: ["SENT", "VIEWED"] },
    },
    orderBy: { sentAt: "desc" },
  });

  if (!invitation) {
    return NextResponse.json(
      { success: false, message: "No open invitation for this job." },
      { status: 400 }
    );
  }

  const fd = new FormData();
  fd.set("invitationId", invitation.id);
  fd.set("amount", String(body.amount ?? ""));
  if (body.scope) fd.set("scope", String(body.scope));
  if (body.startDate) fd.set("startDate", String(body.startDate));

  const result = await submitQuoteAction(fd);
  return NextResponse.json(result, { status: result.success ? 201 : 400 });
}
