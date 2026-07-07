import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { UserRole } from "@/generated/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth([UserRole.SUPER_ADMIN, UserRole.ADMIN]);
    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        isActive: true,
        emailVerified: true,
      },
    });
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
