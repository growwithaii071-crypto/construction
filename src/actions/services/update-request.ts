"use server";

import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { UserRole, ServiceRequestStatus } from "@/generated/prisma";
import { revalidatePath } from "next/cache";
import { sendTemplateEmail } from "@/lib/email";
import { getAppUrl } from "@/lib/app-url";
import { createNotification, notifyAdmins } from "@/lib/notifications";
import { createDealFromAcceptedServiceRequest } from "@/lib/service-request-deal";
import { formatMoney } from "@/lib/money";

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
    title: "Request accepted — pay to start",
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
  status: ServiceRequestStatus,
  formData?: FormData
) {
  const session = await requireAuth([UserRole.CONTRACTOR]);
  const contractorId = session.user.id!;

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
          priceFrom: true,
          priceTo: true,
          contractor: { select: { name: true } },
        },
      },
    },
  });

  if (!existing) {
    throw new Error("Request not found or not authorized.");
  }

  let dealJobId: string | null = existing.marketplaceJobId;
  let agreedLabel = "";

  if (status === ServiceRequestStatus.IN_PROGRESS && existing.marketplaceJobId) {
    const deal = await prisma.marketplaceJob.findUnique({
      where: { id: existing.marketplaceJobId },
      select: { status: true, amountPaid: true },
    });
    const paidOk =
      deal &&
      ["FUNDED", "IN_PROGRESS", "COMPLETED", "PAID_OUT"].includes(deal.status) &&
      (deal.amountPaid ?? 0) > 0;
    if (!paidOk) {
      throw new Error(
        "Client must pay at least the first installment before you can start work."
      );
    }
  }

  if (status === ServiceRequestStatus.ACCEPTED) {
    const rawAmount = formData?.get("agreedAmount");
    const agreedAmount =
      rawAmount != null && String(rawAmount).trim() !== ""
        ? Number(rawAmount)
        : existing.budget;

    try {
      const deal = await createDealFromAcceptedServiceRequest({
        requestId,
        contractorId,
        agreedAmount,
      });
      dealJobId = deal.jobId;
      if ("agreed" in deal && deal.agreed) {
        agreedLabel = formatMoney(deal.agreed);
      }
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : "Could not create payment deal."
      );
    }
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
      messagesUrl: `${getAppUrl()}/customer/messages/${requestId}`,
      requestsUrl: `${getAppUrl()}/customer/requests`,
      servicesUrl: `${getAppUrl()}/services`,
      payUrl: dealJobId ? `${getAppUrl()}/customer/jobs/${dealJobId}/pay` : "",
    }).catch(() => {});
  }

  const copy = STATUS_COPY[status];
  if (copy) {
    const link =
      status === "ACCEPTED" && dealJobId
        ? `/customer/jobs/${dealJobId}/pay`
        : status === "ACCEPTED" || status === "IN_PROGRESS"
          ? `/customer/messages/${requestId}`
          : "/customer/requests";

    const extra =
      status === "ACCEPTED" && agreedLabel
        ? ` Agreed amount ${agreedLabel}. Pay full or in parts — platform commission is taken on the first payment.`
        : "";

    void createNotification({
      userId: existing.client.id,
      title: copy.title,
      message: `${existing.service.contractor.name} ${copy.message} “${existing.service.title}”.${extra}`,
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
  revalidatePath("/customer/jobs");
  if (dealJobId) {
    revalidatePath(`/customer/jobs/${dealJobId}`);
    revalidatePath(`/customer/jobs/${dealJobId}/pay`);
  }
}
