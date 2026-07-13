"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { UserRole } from "@/generated/prisma";
import { revalidatePath } from "next/cache";

const RequestServiceSchema = z.object({
  serviceId: z.string().min(1),
  message: z.string().optional(),
  location: z.string().optional(),
  budget: z.coerce.number().min(0).optional(),
});

export async function requestServiceAction(formData: unknown) {
  const session = await requireAuth([UserRole.CLIENT]);

  const parsed = RequestServiceSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    // Check not already requested
    const existing = await prisma.serviceRequest.findFirst({
      where: { serviceId: parsed.data.serviceId, clientId: session.user.id, status: { in: ["PENDING", "ACCEPTED", "IN_PROGRESS"] } },
    });
    if (existing) {
      return { success: false, message: "You have already requested this service." };
    }

    await prisma.serviceRequest.create({
      data: {
        serviceId: parsed.data.serviceId,
        clientId: session.user.id,
        message: parsed.data.message,
        location: parsed.data.location,
        budget: parsed.data.budget,
      },
    });

    revalidatePath("/customer/services");
    return { success: true, message: "Request sent to contractor!" };
  } catch (error) {
    console.error("[REQUEST_SERVICE]", error);
    return { success: false, message: "Something went wrong. Please try again." };
  }
}
