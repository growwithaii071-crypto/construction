import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { UserRole } from "@/generated/prisma";
import { createJobAction } from "@/actions/marketplace/jobs";

/** POST /api/jobs — customer creates job, triggers matching */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== UserRole.CLIENT) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const fd = new FormData();
    fd.set("title", String(body.title ?? ""));
    fd.set("description", String(body.description ?? ""));
    fd.set("category", String(body.category ?? ""));
    if (body.location) fd.set("location", String(body.location));
    if (body.budgetMin != null) fd.set("budgetMin", String(body.budgetMin));
    if (body.budgetMax != null) fd.set("budgetMax", String(body.budgetMax));
    if (Array.isArray(body.photos)) fd.set("photos", body.photos.join("\n"));

    const result = await createJobAction(fd);
    return NextResponse.json(result, { status: result.success ? 201 : 400 });
  } catch (err) {
    console.error("[API_JOBS_POST]", err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
