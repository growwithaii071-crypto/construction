"use server";

import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { UserRole, ServiceRequestStatus } from "@/generated/prisma";
import { revalidatePath } from "next/cache";
import { uploadMessageAttachment } from "@/lib/upload";
import { sendTemplateEmail, appUrl } from "@/lib/email";
import { createNotification } from "@/lib/notifications";

const CHAT_ALLOWED: ServiceRequestStatus[] = [
  ServiceRequestStatus.ACCEPTED,
  ServiceRequestStatus.IN_PROGRESS,
  ServiceRequestStatus.COMPLETED,
];

async function getAuthorizedRequest(requestId: string, userId: string, role: string) {
  const req = await prisma.serviceRequest.findUnique({
    where: { id: requestId },
    include: {
      service: {
        select: {
          title: true,
          contractorId: true,
          contractor: { select: { id: true, name: true, email: true } },
        },
      },
      client: { select: { id: true, name: true, email: true } },
    },
  });

  if (!req) return { error: "Request not found." as const };

  const isClient = role === UserRole.CLIENT && req.clientId === userId;
  const isContractor = role === UserRole.CONTRACTOR && req.service.contractorId === userId;

  if (!isClient && !isContractor) {
    return { error: "You are not allowed to access this conversation." as const };
  }

  return { req, isClient, isContractor };
}

function revalidateChat(requestId: string) {
  revalidatePath(`/customer/messages/${requestId}`);
  revalidatePath(`/construction/messages/${requestId}`);
  revalidatePath("/customer/messages");
  revalidatePath("/construction/messages");
  revalidatePath("/customer/requests");
  revalidatePath("/construction/requests");
}

export async function sendMessageAction(formData: FormData) {
  const session = await requireAuth([UserRole.CLIENT, UserRole.CONTRACTOR]);
  const userId = session.user.id;
  const role = (session.user as { role?: string }).role ?? "";

  const requestId = String(formData.get("requestId") ?? "");
  const text = String(formData.get("body") ?? "").trim();
  const file = formData.get("file");

  if (!requestId) return { success: false as const, message: "Missing request." };
  if (text.length > 2000) return { success: false as const, message: "Message is too long." };

  const hasFile = file instanceof File && file.size > 0;
  if (!text && !hasFile) {
    return { success: false as const, message: "Write a message or attach a file." };
  }

  const result = await getAuthorizedRequest(requestId, userId, role);
  if ("error" in result) return { success: false as const, message: result.error };

  if (!CHAT_ALLOWED.includes(result.req.status)) {
    return {
      success: false as const,
      message: "Messaging unlocks after the contractor accepts this request.",
    };
  }

  let attachment: {
    attachmentUrl: string;
    attachmentName: string;
    attachmentMime: string;
    attachmentSize: number;
  } | null = null;

  if (hasFile && file instanceof File) {
    const uploaded = await uploadMessageAttachment(file, requestId);
    if (!uploaded.success) {
      return { success: false as const, message: uploaded.message };
    }
    attachment = {
      attachmentUrl: uploaded.file.url,
      attachmentName: uploaded.file.name,
      attachmentMime: uploaded.file.mime,
      attachmentSize: uploaded.file.size,
    };
  }

  await prisma.message.create({
    data: {
      body: text,
      serviceRequestId: requestId,
      senderId: userId,
      ...(attachment ?? {}),
    },
  });

  const isClientSender = result.isClient;
  const recipient = isClientSender
    ? result.req.service.contractor
    : result.req.client;
  const senderName = isClientSender
    ? result.req.client.name
    : result.req.service.contractor.name;
  const messagesUrl = isClientSender
    ? `${appUrl}/construction/messages/${requestId}`
    : `${appUrl}/customer/messages/${requestId}`;
  const preview =
    text ||
    (attachment ? `📎 ${attachment.attachmentName}` : "New message");

  void sendTemplateEmail("new_message", recipient.email, {
    recipientName: recipient.name,
    senderName,
    serviceTitle: result.req.service.title,
    messagePreview: preview.slice(0, 200),
    messagesUrl,
  }).catch(() => {});

  void createNotification({
    userId: recipient.id,
    title: "New message",
    message: `${senderName}: ${preview.slice(0, 120)}`,
    type: "INFO",
    link: isClientSender
      ? `/construction/messages/${requestId}`
      : `/customer/messages/${requestId}`,
  });

  revalidateChat(requestId);
  return { success: true as const };
}
