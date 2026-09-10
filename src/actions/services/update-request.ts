"use server";

import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { UserRole, ServiceRequestStatus } from "@/generated/prisma";
import { revalidatePath } from "next/cache";
import { sendTemplateEmail, appUrl } from "@/lib/email";
import { createNotification, notifyAdmins } from "@/lib/notifications";

const STATUS_TEMPLATE: Partial<Record<ServiceRequestStatus, string>> = {
  ACCEPTED: "service_request_accepted",
  REJECTED: "service_request_rejected",
  IN_PROGRESS: "service_request_in_progress",
  COMPLETED: "service_request_completed",
};

const STATUS_COPY: Partial<
  Record<ServiceRequestStatus, { title: string; message: string; type: "SUCCESS" | "WARNING" | "INFO" }>
> = {
  ACCEPTED: {
    title: "Request accepted",
    message: "accepted your request for",
    type: "SUCCESS",
  },
  REJECTED: {
    title: "Request declined",
    message: "declined your request for",
    type: "WARNING",
  },
  IN_PROGRESS: {
    title: "Work started",
    message: "started work on",
    type: "INFO",
  },
  COMPLETED: {
    title: "Job completed",
    message: "completed",
    type: "SUCCESS",
  },
};

export async function updateRequestStatusAction(
  requestId: string,
  status: ServiceRequestStatus
) {
  const session = await requireAuth([UserRole.CONTRACTOR]);
  const contractorId = session.user.id;

  const existing = await prisma.serviceRequest.findFirst({
    where: {
      id: requestId,
      service: { contractorId },
    },
    include: {
      client: { select: { id: true, name: true, email: true } },
      service: {
        select: {
          title: true,
          contractor: { select: { name: true } },
        },
      },
    },
  });

  if (!existing) {
    throw new Error("Request not found or not authorized.");
  }

  await prisma.serviceRequest.update({
    where: { id: requestId },
    data: { status },
  });

  const templateKey = STATUS_TEMPLATE[status];
  if (templateKey) {
    void sendTemplateEmail(templateKey, existing.client.email, {
      clientName: existing.client.name,
      contractorName: existing.service.contractor.name,
      serviceTitle: existing.service.title,
      messagesUrl: `${appUrl}/customer/messages/${requestId}`,
      requestsUrl: `${appUrl}/customer/requests`,
      servicesUrl: `${appUrl}/services`,
    }).catch(() => {});
  }

  const copy = STATUS_COPY[status];
  if (copy) {
    const link =
      status === "ACCEPTED" || status === "IN_PROGRESS"
        ? `/customer/messages/${requestId}`
        : "/customer/requests";

    void createNotification({
      userId: existing.client.id,
      title: copy.title,
      message: `${existing.service.contractor.name} ${copy.message} “${existing.service.title}”.`,
      type: copy.type,
      link,
    });

    void notifyAdmins({
      title: `Request ${status.toLowerCase().replace("_", " ")}`,
      message: `${existing.service.contractor.name} → ${existing.client.name}: “${existing.service.title}” is now ${status}.`,
      type: "INFO",
      link: "/projects",
    });
  }

  revalidatePath("/construction/requests");
  revalidatePath("/customer/requests");
  revalidatePath("/construction/messages");
  revalidatePath("/customer/messages");
  revalidatePath("/customer/notifications");
  revalidatePath("/notifications");
}
