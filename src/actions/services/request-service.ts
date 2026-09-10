"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { UserRole } from "@/generated/prisma";
import { revalidatePath } from "next/cache";
import { sendTemplateEmail, appUrl } from "@/lib/email";
import { createNotification, notifyAdmins } from "@/lib/notifications";

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
    const existing = await prisma.serviceRequest.findFirst({
      where: {
        serviceId: parsed.data.serviceId,
        clientId: session.user.id,
        status: { in: ["PENDING", "ACCEPTED", "IN_PROGRESS"] },
      },
    });
    if (existing) {
      return { success: false, message: "You have already requested this service." };
    }

    const service = await prisma.service.findUnique({
      where: { id: parsed.data.serviceId },
      include: {
        contractor: { select: { id: true, name: true, email: true } },
      },
    });

    if (!service || !service.isActive) {
      return { success: false, message: "Service not found or inactive." };
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

    const clientName = session.user.name ?? "Client";
    void sendTemplateEmail("service_request_created", service.contractor.email, {
      contractorName: service.contractor.name,
      clientName,
      serviceTitle: service.title,
      category: service.category ?? "—",
      location: parsed.data.location || "—",
      budget: parsed.data.budget != null ? `₹${parsed.data.budget}` : "—",
      message: parsed.data.message || "—",
      requestsUrl: `${appUrl}/construction/requests`,
    }).catch(() => {});

    void createNotification({
      userId: service.contractor.id,
      title: "New service request",
      message: `${clientName} requested “${service.title}”.`,
      type: "INFO",
      link: "/construction/requests",
    });

    void notifyAdmins({
      title: "New marketplace request",
      message: `${clientName} requested “${service.title}” from ${service.contractor.name}.`,
      type: "INFO",
      link: "/projects",
    });

    revalidatePath("/customer/services");
    return { success: true, message: "Request sent to contractor!" };
  } catch (error) {
    console.error("[REQUEST_SERVICE]", error);
    return { success: false, message: "Something went wrong. Please try again." };
  }
}
