import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();

  // Not logged in → tell client to redirect to login
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, requiresLogin: true }, { status: 401 });
  }

  const role = (session.user as { role?: string }).role;
  if (role !== "CLIENT") {
    return NextResponse.json({ success: false, message: "Only customers can request services." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { serviceId, message, location, budget } = body;

    if (!serviceId) {
      return NextResponse.json({ success: false, message: "Service ID is required." }, { status: 400 });
    }

    // Check service exists
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service || !service.isActive) {
      return NextResponse.json({ success: false, message: "Service not found or inactive." }, { status: 404 });
    }

    // Check if already requested
    const existing = await prisma.serviceRequest.findFirst({
      where: { serviceId, clientId: session.user.id, status: { in: ["PENDING", "ACCEPTED", "IN_PROGRESS"] } },
    });
    if (existing) {
      return NextResponse.json({ success: false, message: "You have already requested this service." }, { status: 409 });
    }

    await prisma.serviceRequest.create({
      data: {
        serviceId,
        clientId: session.user.id,
        message: message ?? null,
        location: location ?? null,
        budget: budget ? Number(budget) : null,
        status: "PENDING",
      },
    });

    return NextResponse.json({ success: true, message: "Request sent to contractor!" });
  } catch (err) {
    console.error("[SERVICE_REQUEST]", err);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
}
