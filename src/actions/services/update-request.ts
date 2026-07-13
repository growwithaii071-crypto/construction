"use server";

import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { UserRole, ServiceRequestStatus } from "@/generated/prisma";
import { revalidatePath } from "next/cache";

export async function updateRequestStatusAction(
  requestId: string,
  status: ServiceRequestStatus
) {
  await requireAuth([UserRole.CONTRACTOR]);

  await prisma.serviceRequest.update({
    where: { id: requestId },
    data: { status },
  });

  revalidatePath("/construction/requests");
}
