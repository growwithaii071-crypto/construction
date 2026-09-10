import prisma from "@/lib/prisma";
import { UserRole } from "@/generated/prisma";

export type NotificationType = "INFO" | "SUCCESS" | "WARNING" | "ERROR";

type CreateNotificationInput = {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  link?: string;
};

/** Create a single in-app notification (fire-and-forget safe). */
export async function createNotification(input: CreateNotificationInput) {
  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        title: input.title,
        message: input.message,
        type: input.type ?? "INFO",
        link: input.link,
      },
    });
  } catch (err) {
    console.error("[NOTIFICATION]", err);
  }
}

/** Notify many users with the same payload. */
export async function notifyUsers(
  userIds: string[],
  payload: Omit<CreateNotificationInput, "userId">
) {
  const unique = [...new Set(userIds.filter(Boolean))];
  await Promise.all(unique.map((userId) => createNotification({ ...payload, userId })));
}

/** Notify all ADMIN + SUPER_ADMIN users. */
export async function notifyAdmins(payload: Omit<CreateNotificationInput, "userId">) {
  try {
    const admins = await prisma.user.findMany({
      where: {
        role: { in: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
        isActive: true,
      },
      select: { id: true },
    });
    await notifyUsers(
      admins.map((a) => a.id),
      payload
    );
  } catch (err) {
    console.error("[NOTIFY_ADMINS]", err);
  }
}
